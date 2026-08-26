// Domain constants. Anything that would otherwise be a magic number or a string
// literal repeated across modules lives here.

/** Credits charged once to upgrade an account to a tournament host. */
export const HOST_UPGRADE_COST = 20

/** Tournament formats. */
export const TOURNAMENT_TYPES = ['brackets', 'battle royale']

/** How participants get in. */
export const ACCESSIBILITY = ['open', 'application required']

/** Ledger entry kinds written for every credit movement. */
export const TRANSACTION_TYPES = [
  'purchase',
  'entry_fee',
  'bank_deposit',
  'payout',
  'host_upgrade',
  'refund',
]

/**
 * Tournament categories. Fixed list rather than free text so filtering, seeding,
 * and the category artwork all agree on the same set. Each `slug` maps to a
 * local, original SVG card — no third-party game imagery.
 */
export const CATEGORIES = [
  { slug: 'battle-royale', name: 'Battle Royale' },
  { slug: 'tactical-shooter', name: 'Tactical Shooter' },
  { slug: 'moba', name: 'MOBA' },
  { slug: 'fighting', name: 'Fighting' },
  { slug: 'racing', name: 'Racing' },
  { slug: 'strategy', name: 'Strategy' },
  { slug: 'sports-sim', name: 'Sports Sim' },
  { slug: 'card-game', name: 'Card Game' },
  { slug: 'football', name: 'Football' },
  { slug: 'basketball', name: 'Basketball' },
  { slug: 'tennis', name: 'Tennis' },
  { slug: 'volleyball', name: 'Volleyball' },
  { slug: 'chess', name: 'Chess' },
]

export const CATEGORY_SLUGS = CATEGORIES.map((category) => category.slug)

/** Text length ceilings, enforced on the sanitised plain text. */
export const LIMITS = {
  title: 80,
  description: 200,
  rules: 800,
  update: 500,
  teamName: 32,
  applicationFields: 10,
  applicationInput: 200,
}

/** Default and maximum page sizes for paginated list endpoints. */
export const PAGE_SIZE = { default: 12, max: 50 }
