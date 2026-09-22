import User from '../../models/user.model.js'
import Tournament from '../../models/tournament.model.js'
import { CONTACT_EMAIL, FREE_LIVE_TOURNAMENTS, PLAN, planIsActive } from '../../config/plans.js'
import { UNPUBLISHED } from '../../config/publishStates.js'
import config from '../../config/env.js'
import { ApiError } from '../../utils/ApiError.js'
import * as gateway from '../../payments/paddle.js'

/**
 * What this account is allowed to do, and what it would cost to do more.
 *
 * One call answers the whole billing screen and the publish button, so the two
 * can never disagree about whether a tournament may go live.
 */
export async function planFor(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')

  const live = await countLive(userId)
  const active = user.hasActivePlan

  return {
    status: user.hostingPlan?.status ?? 'none',
    active,
    renewsAt: user.hostingPlan?.renewsAt ?? null,
    plan: { name: PLAN.name, priceCents: PLAN.priceCents, interval: PLAN.interval },
    liveTournaments: live,
    freeLiveTournaments: FREE_LIVE_TOURNAMENTS,
    canPublish: active || live < FREE_LIVE_TOURNAMENTS,
    contactEmail: CONTACT_EMAIL,
    gateway: gateway.canTakeCards()
      ? {
          provider: 'paddle',
          clientToken: config.paddle.clientToken,
          environment: config.paddle.environment,
        }
      : null,
  }
}

/** How many of this host's tournaments are live and not yet finished. */
export function countLive(userId) {
  return Tournament.countDocuments({
    host: userId,
    hasEnded: { $ne: true },
    publishState: { $nin: UNPUBLISHED },
  })
}

/**
 * Whether this host may put one more tournament in front of people.
 *
 * A finished tournament does not count against the free allowance: the limit is
 * about how much is running at once, not how much has ever been run, so an
 * organiser on the free plan can hold an event every week forever. What they
 * cannot do is have two open at the same time.
 */
export async function assertMayPublish(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  if (user.hasActivePlan) return

  const live = await countLive(userId)
  if (live < FREE_LIVE_TOURNAMENTS) return

  throw new ApiError(
    402,
    `The free plan runs ${FREE_LIVE_TOURNAMENTS} tournament at a time. Subscribe to run as many as you like, or finish the one you have.`,
    { code: 'PLAN_LIMIT_REACHED' }
  )
}

/** Opens a checkout for the plan, or says why it cannot. */
export async function startCheckout(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  if (user.hasActivePlan) throw ApiError.conflict('This account already has an active plan')

  try {
    return await gateway.createSubscriptionCheckout({ userId: String(user._id), email: user.email })
  } catch (error) {
    // A gateway that will not open a checkout is not this app being broken and
    // not something the host can act on, so it reads as the gateway being
    // unavailable. The message is kept for the log: the commonest cause is an
    // account whose onboarding is unfinished, and that sentence is the diagnosis.
    throw new ApiError(503, 'Card payments are not available right now', {
      code: 'PAYMENTS_UNAVAILABLE',
      details: error?.message,
    })
  }
}

/**
 * Writes what the gateway says a subscription is now.
 *
 * Idempotent by construction: it sets a state rather than moving one, so the
 * same delivery twice lands on the same answer. Out-of-order deliveries are the
 * real hazard — gateways do not promise order — so an event that is older than
 * what is already recorded is ignored rather than allowed to resurrect a
 * cancelled plan.
 */
export async function applySubscription({ userId, subscriptionId, status, renewsAt, occurredAt }) {
  if (!userId) return { applied: false, reason: 'no user on the event' }

  const user = await User.findById(userId)
  if (!user) return { applied: false, reason: 'unknown user' }

  const seen = user.hostingPlan?.updatedAt
  if (seen && occurredAt && occurredAt < seen) {
    return { applied: false, reason: 'older than what is recorded' }
  }

  user.hostingPlan = {
    status,
    subscriptionId: subscriptionId ?? user.hostingPlan?.subscriptionId,
    provider: 'paddle',
    renewsAt: renewsAt ?? user.hostingPlan?.renewsAt,
    updatedAt: occurredAt ?? new Date(),
  }
  await user.save()

  return { applied: true, status, active: planIsActive(status) }
}
