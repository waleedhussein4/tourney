// Paid publishing: the tiers, their prices, and where the money is sent.
//
// This is the only file either may appear in. `npm run check:regressions` has a
// gate that fails the build if the Whish number turns up anywhere else, so the
// number a host is told to pay can never disagree with itself.

/**
 * The Whish Money number hosts pay the publishing fee to.
 *
 * PLACEHOLDER — replace with the real number before taking a payment.
 */
export const WHISH_NUMBER = '+961 00 000 000'

/**
 * The number hosts message to ask about publishing, in the form wa.me wants:
 * country code and digits, nothing else.
 *
 * PLACEHOLDER — replace alongside WHISH_NUMBER.
 */
export const WHATSAPP_NUMBER = '96100000000'

/** Where a tournament is on its way to being visible. */
export const PUBLISH_STATES = ['draft', 'pending_payment', 'published']

/** Ordered smallest first: a tournament gets the first tier its cap fits in. */
export const PUBLISH_TIERS = [
  { tier: 'free', maxCapacity: 8, amountLbp: 0 },
  { tier: 'small', maxCapacity: 16, amountLbp: 150_000 },
  { tier: 'large', maxCapacity: 64, amountLbp: 300_000 },
]

/**
 * The tier for a tournament's configured cap, or `null` when it is larger than
 * anything on the price list.
 *
 * `maxCapacity` counts participant slots — teams, in a team tournament — which
 * is the one meaning the rest of the codebase gives it.
 */
export function tierFor(maxCapacity) {
  return PUBLISH_TIERS.find((entry) => maxCapacity <= entry.maxCapacity) ?? null
}
