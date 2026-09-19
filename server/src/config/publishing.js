// Paid publishing: the tiers, their prices, and where the money is sent.
//
// This is the only file any of it may appear in. `npm run check:regressions`
// fails the build if the payment contact turns up anywhere else, so what a host
// is told can never disagree with itself.

/**
 * The currency every fee is quoted and charged in.
 *
 * Lebanon prices digital services in US dollars, and a card payment settles in
 * dollars whatever the card was issued in — so the lira never appears here.
 */
export const CURRENCY = 'USD'

/**
 * Where a host asks a question before paying.
 *
 * An email address rather than a phone number: this is published on a page
 * anyone can read, and a personal number cannot be taken back once it is out.
 */
export const CONTACT_EMAIL = 'hosts@tourney.app'

/** Where a tournament is on its way to being visible. */
export const PUBLISH_STATES = ['draft', 'pending_payment', 'published']

/**
 * The states that hide a tournament from everyone but its host.
 *
 * Visibility is decided by this list rather than by `=== 'published'`, so a
 * document written before the field existed — which has no `publishState` at
 * all — reads as public, which is what it was.
 */
export const UNPUBLISHED = ['draft', 'pending_payment']

/**
 * Ordered smallest first: a tournament gets the first tier its cap fits in.
 *
 * Amounts are in cents, which is what every payment processor charges in and
 * the only way to hold money that never rounds wrong.
 */
export const PUBLISH_TIERS = [
  { tier: 'free', maxCapacity: 8, amountCents: 0 },
  { tier: 'small', maxCapacity: 16, amountCents: 500 },
  { tier: 'large', maxCapacity: 64, amountCents: 1000 },
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
