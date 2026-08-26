/**
 * The credit packages the demo checkout offers.
 *
 * They live in code rather than only in the database so a fresh deployment has
 * something to sell before anyone runs the seed, and so the catalogue is
 * reviewable in a diff.
 */
export const DEFAULT_PRODUCTS = [
  { _id: 'credits-100', name: 'Starter', credits: 100, price: 5 },
  { _id: 'credits-500', name: 'Contender', credits: 500, price: 20 },
  { _id: 'credits-1200', name: 'Champion', credits: 1200, price: 40 },
]
