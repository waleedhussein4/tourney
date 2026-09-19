import PublishRequest from '../../models/publishRequest.model.js'
import config from '../../config/env.js'
import { CONTACT_EMAIL, tierFor } from '../../config/publishing.js'
import * as gateway from '../../payments/paddle.js'
import { withTransaction } from '../../db/withTransaction.js'
import { ApiError } from '../../utils/ApiError.js'
import { loadAsHost, loadTournament } from '../tournaments/tournament.service.js'

// The publishing state machine — see docs/MONETISATION.md.
//
//   draft ──(free tier)──▶ published
//   draft ──(paid tier)──▶ pending_payment ──(admin confirms)──▶ published
//                          pending_payment ──(admin rejects)───▶ draft
//
// No money moves here and no credits are involved: the fee is paid outside the
// app, and an admin says so by hand. Every transition that touches both the
// tournament and its request row runs in one transaction, so the queue and the
// tournaments can never disagree about what is waiting.

/**
 * What this tournament would cost to publish, and who to ask about paying it.
 *
 * Served rather than held in the client, because where the money goes is a
 * business detail that changes without a deploy — and a regression gate keeps
 * it out of every file but the config.
 */
export async function quote(tournamentId, hostId) {
  const tournament = await loadAsHost(tournamentId, hostId)
  const tier = tierFor(tournament.maxCapacity)

  return {
    publishState: tournament.publishState,
    tier: tier?.tier ?? null,
    amountCents: tier?.amountCents ?? null,
    maxCapacity: tournament.maxCapacity,
    // The host pays from their own phone, so the reference has to be something
    // they can read off the screen and type into a transfer: the tournament's id.
    reference: String(tournament._id),
    // Only when there is no card gateway: it is the fallback route, and
    // offering it beside a working checkout invites a host to take the slow one.
    contactEmail: tier && tier.amountCents > 0 && !gateway.canTakeCards() ? CONTACT_EMAIL : null,
    requestedAt: tournament.publishRequest?.requestedAt ?? null,
    // What the browser needs to open the gateway's checkout. The client token is
    // published on purpose — it identifies the account, it does not authorise
    // anything. The API key never leaves the server.
    gateway: gateway.canTakeCards()
      ? {
          provider: 'paddle',
          clientToken: config.paddle.clientToken,
          environment: config.paddle.environment,
        }
      : null,
  }
}

/**
 * The host asks for their tournament to go live.
 *
 * The tier is derived here, from the cap the tournament was created with — the
 * host never sends one, so there is nothing to tamper with.
 */
export async function publish(tournamentId, hostId) {
  return withTransaction(async (session) => {
    const tournament = await loadAsHost(tournamentId, hostId, session)
    if (tournament.publishState !== 'draft') {
      throw ApiError.conflict(
        tournament.isPublished
          ? 'This tournament is already published'
          : 'This tournament is already waiting for its payment to be confirmed'
      )
    }

    const tier = tierFor(tournament.maxCapacity)
    if (!tier) {
      throw ApiError.badRequest(
        `No publishing tier covers ${tournament.maxCapacity} slots yet — get in touch and we will sort it out`
      )
    }

    if (tier.amountCents === 0) {
      tournament.publishState = 'published'
      await tournament.save({ session })
      return { tournament, checkout: null }
    }

    const requestedAt = new Date()
    tournament.publishState = 'pending_payment'
    tournament.publishRequest = { tier: tier.tier, amountCents: tier.amountCents, requestedAt }
    await tournament.save({ session })

    const [request] = await PublishRequest.create(
      [
        {
          tournamentId: tournament._id,
          tournamentTitle: tournament.title,
          hostId,
          tier: tier.tier,
          amountCents: tier.amountCents,
          requestedAt,
        },
      ],
      { session }
    )

    // A gateway that is configured opens a checkout the host pays right now. One
    // that is not leaves the request for a human, which is the same row either
    // way — the difference is only who confirms it.
    let checkout = null
    if (gateway.canTakeCards()) {
      checkout = await gateway.createCheckout({
        priceId: config.paddle.prices[tier.tier],
        tournamentId: String(tournament._id),
        publishRequestId: String(request._id),
      })
    }

    return { tournament, checkout }
  })
}

/** The admin queue: everything waiting on a payment, newest first. */
export async function listPending() {
  return PublishRequest.find({ status: 'pending' })
    .sort({ requestedAt: -1 })
    .populate('hostId', 'username email')
}

/** An admin has seen the money arrive. */
export async function confirm(requestId, adminId, paymentRef) {
  return resolve(requestId, (request, tournament) => {
    request.status = 'confirmed'
    request.confirmedAt = new Date()
    request.confirmedBy = adminId
    if (paymentRef) request.paymentRef = paymentRef
    tournament.publishState = 'published'
  })
}

/**
 * A payment provider says the money is in. Publishes the tournament.
 *
 * This is the whole of what a webhook does, and it is deliberately the same
 * transition an admin performs by hand — one path to `published`, whoever
 * triggered it.
 *
 * Idempotent in two independent ways, because a provider may deliver the same
 * event more than once and two deliveries can land at the same moment:
 * a replay finds the request already confirmed and returns it unchanged, and
 * `providerRef` carries a unique index, so a genuine race loses at the database
 * rather than confirming twice.
 *
 * @param {string} tournamentId
 * @param {{provider: string, providerRef: string}} payment
 */
export async function markPaid(tournamentId, { provider, providerRef }) {
  const already = await PublishRequest.findOne({ providerRef })
  if (already) return { request: already, published: false }

  return withTransaction(async (session) => {
    const request = await PublishRequest.findOne({ tournamentId, status: 'pending' })
      .sort({ requestedAt: -1 })
      .session(session)

    // A payment for something we are not waiting on. Worth knowing about, but
    // not worth failing the webhook over — the provider would retry forever.
    if (!request) return { request: null, published: false }

    const tournament = await loadTournament(request.tournamentId, session)
    if (tournament.publishState !== 'pending_payment') {
      return { request, published: false }
    }

    request.status = 'confirmed'
    request.confirmedAt = new Date()
    request.provider = provider
    request.providerRef = providerRef
    tournament.publishState = 'published'

    await tournament.save({ session })
    await request.save({ session })

    return { request, published: true }
  })
}

/** The money did not arrive. The tournament goes back to a draft the host can resubmit. */
export async function reject(requestId, adminId, reason) {
  return resolve(requestId, (request, tournament) => {
    request.status = 'rejected'
    request.rejectedAt = new Date()
    request.rejectedBy = adminId
    if (reason) request.reason = reason
    tournament.publishState = 'draft'
  })
}

/**
 * Loads a request and its tournament, checks both are still waiting, applies
 * `transition`, and saves the pair together.
 *
 * Anything already resolved is a 409 — _not again_ — so a double click, or two
 * admins working the same queue, cannot confirm a rejected payment or the
 * reverse.
 */
async function resolve(requestId, transition) {
  return withTransaction(async (session) => {
    const request = await PublishRequest.findById(requestId).session(session)
    if (!request) throw ApiError.notFound('Publish request not found')
    if (request.status !== 'pending') {
      throw ApiError.conflict(`This request has already been ${request.status}`)
    }

    const tournament = await loadTournament(request.tournamentId, session)
    if (tournament.publishState !== 'pending_payment') {
      throw ApiError.conflict('This tournament is not waiting on a payment')
    }

    transition(request, tournament)
    await tournament.save({ session })
    await request.save({ session })

    return request
  })
}
