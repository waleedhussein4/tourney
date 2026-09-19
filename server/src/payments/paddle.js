// The card gateway.
//
// Everything that knows Paddle exists lives here. The rest of the app asks for
// a checkout and is told a payment happened; swapping provider means writing
// another file with these three functions, not touching the publish rules.

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
 * Opens a transaction for one publishing fee.
 *
 * The transaction is created here rather than in the browser on purpose. Paddle
 * will happily open a checkout from a price id alone, but then the amount and
 * the tournament it belongs to are both chosen by the page — and a host who
 * edits them pays for the tier they picked, not the tier they are buying. Made
 * server-side, both are ours.
 *
 * @param {{priceId: string, tournamentId: string, publishRequestId: string}} order
 * @returns {Promise<{transactionId: string}>}
 */
export async function createCheckout({ priceId, tournamentId, publishRequestId }) {
  const transaction = await paddle().transactions.create({
    items: [{ priceId, quantity: 1 }],
    customData: { tournamentId, publishRequestId },
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

/**
 * The one event that means money has settled.
 *
 * `transaction.paid` fires when the card is captured and `transaction.completed`
 * when Paddle has finished with it. Both mean paid; the later one is the one
 * with the fees worked out, and publishing a tournament a few seconds later
 * costs nothing.
 */
export const isPaymentSettled = (event) => event?.eventType === EventName.TransactionCompleted

/** What the event says was bought, in our terms. */
export function paymentFrom(event) {
  const data = event.data ?? {}
  return {
    providerRef: data.id,
    tournamentId: data.customData?.tournamentId ?? null,
    publishRequestId: data.customData?.publishRequestId ?? null,
    // Minor units, as a string, exactly as every Paddle amount arrives.
    totalCents: Number(data.details?.totals?.total ?? NaN),
    currency: data.currencyCode ?? null,
  }
}
