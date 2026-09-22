// The payment gateway.
//
// Everything that knows Paddle exists lives here. The rest of the app asks for
// a checkout and is told a subscription changed; swapping provider means another
// file with these functions, not a change to who may publish.

import { Paddle, Environment, EventName } from '@paddle/paddle-node-sdk'
import config from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

let client

/** Built once, lazily: a server with no keys never constructs one. */
function paddle() {
  if (!config.paddle.enabled) {
    throw new ApiError(503, 'Card payments are not configured on this deployment', {
      code: 'PAYMENTS_UNAVAILABLE',
    })
  }
  client ??= new Paddle(config.paddle.apiKey, {
    environment:
      config.paddle.environment === 'production' ? Environment.production : Environment.sandbox,
  })
  return client
}

/** Whether this deployment can take a card at all. */
export const canTakeCards = () => config.paddle.enabled

/**
 * Opens a transaction for one subscription.
 *
 * Created server-side rather than from a price id in the browser: that way the
 * plan being bought and the account it belongs to are ours, not the page's.
 *
 * @param {{userId: string, email: string}} buyer
 * @returns {Promise<{transactionId: string}>}
 */
export async function createSubscriptionCheckout({ userId, email }) {
  const transaction = await paddle().transactions.create({
    items: [{ priceId: config.paddle.planPriceId, quantity: 1 }],
    customData: { userId },
    ...(email ? { customer: { email } } : {}),
  })
  return { transactionId: transaction.id }
}

/**
 * Turns a raw webhook request into an event we trust, or throws.
 *
 * The signature is over the *raw* body, so the route that calls this must not
 * have parsed it — see the comment where the webhook router is mounted.
 *
 * @param {{rawBody: string, signature: string}} delivery
 */
export async function readEvent({ rawBody, signature }) {
  if (!signature) throw ApiError.badRequest('Missing Paddle-Signature header')
  return paddle().webhooks.unmarshal(rawBody, config.paddle.webhookSecret, signature)
}

/** The events that change whether an account may publish. */
const SUBSCRIPTION_EVENTS = new Set([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionCanceled,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
])

export const isSubscriptionEvent = (event) => SUBSCRIPTION_EVENTS.has(event?.eventType)

/**
 * What a subscription event says, in this app's terms.
 *
 * Paddle's statuses are richer than the question being asked here, which is
 * only ever "may this account publish?". `trialing` is treated as active
 * because a trial is a working subscription; everything unrecognised falls to
 * `canceled`, so an unknown state fails closed rather than granting access.
 */
export function subscriptionFrom(event) {
  const data = event.data ?? {}
  const statuses = {
    active: 'active',
    trialing: 'active',
    past_due: 'past_due',
    paused: 'canceled',
    canceled: 'canceled',
  }
  return {
    subscriptionId: data.id ?? null,
    userId: data.customData?.userId ?? null,
    status: statuses[data.status] ?? 'canceled',
    renewsAt: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
    priceIds: (data.items ?? []).map((item) => item?.price?.id).filter(Boolean),
  }
}

/** The event id, for refusing a delivery we have already acted on. */
export const eventIdOf = (event) => event?.eventId ?? null
