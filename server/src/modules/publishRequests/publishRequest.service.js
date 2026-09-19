import PublishRequest from '../../models/publishRequest.model.js'
import { tierFor } from '../../config/publishing.js'
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

    if (tier.amountLbp === 0) {
      tournament.publishState = 'published'
      await tournament.save({ session })
      return tournament
    }

    const requestedAt = new Date()
    tournament.publishState = 'pending_payment'
    tournament.publishRequest = { tier: tier.tier, amountLbp: tier.amountLbp, requestedAt }
    await tournament.save({ session })

    await PublishRequest.create(
      [
        {
          tournamentId: tournament._id,
          tournamentTitle: tournament.title,
          hostId,
          tier: tier.tier,
          amountLbp: tier.amountLbp,
          requestedAt,
        },
      ],
      { session }
    )

    return tournament
  })
}

/** The admin queue: everything waiting on a payment, newest first. */
export async function listPending() {
  return PublishRequest.find({ status: 'pending' })
    .sort({ requestedAt: -1 })
    .populate('hostId', 'username email')
}

/** An admin has seen the money arrive. */
export async function confirm(requestId, adminId, whishRef) {
  return resolve(requestId, (request, tournament) => {
    request.status = 'confirmed'
    request.confirmedAt = new Date()
    request.confirmedBy = adminId
    if (whishRef) request.whishRef = whishRef
    tournament.publishState = 'published'
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
