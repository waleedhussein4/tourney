// What it costs to run tournaments here, and what you get without paying.
//
// This is the only file that names a price. `npm run check:regressions` fails
// the build if the payment contact turns up anywhere else, and the webhook
// checks the charged amount against `PRICE_CENTS` before it activates anything,
// so the gateway's price object and this file are held to each other.

/** The currency every amount here and in the gateway is in. */
export const CURRENCY = 'USD'

/** Where a host writes when something goes wrong with a payment. */
export const CONTACT_EMAIL = 'contact@walenehq.com'

/** The one paid plan. One price, one thing it buys: no limit. */
export const PLAN = Object.freeze({
  id: 'host',
  name: 'Host',
  priceCents: 500,
  interval: 'month',
})

/**
 * How many tournaments an unsubscribed account may have live at once.
 *
 * Not zero, on purpose: an organiser will not pay for something they have not
 * watched work. One live tournament is a real trial — they can run an actual
 * event end to end — and the limit only bites when they want a second one,
 * which is the moment the subscription is worth something to them.
 */
export const FREE_LIVE_TOURNAMENTS = 1

/** Subscription states we care about. Anything else reads as inactive. */
export const PLAN_STATES = ['none', 'active', 'past_due', 'canceled']

/**
 * Whether a plan lets its holder publish without limit.
 *
 * `past_due` counts as active: the card failed, the gateway is retrying, and
 * taking someone's tournaments offline over a temporary decline would be a
 * worse failure than carrying them for a few days.
 */
export const planIsActive = (status) => status === 'active' || status === 'past_due'
