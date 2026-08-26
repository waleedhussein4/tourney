/**
 * The thirteen tournament categories, as the design system sees them.
 *
 * The slugs are the server's (`server/src/config/constants.js`); this table adds
 * the two things only the client needs — the display name, which a slug cannot
 * always reconstruct ("moba" is "MOBA", not "Moba") — and the artwork hue.
 *
 * Hues are spread around the wheel so that thirteen cards in a grid are told
 * apart at a glance, and no two neighbouring categories share one.
 */
export const CATEGORY_META = {
  'battle-royale': { name: 'Battle Royale', hue: 'violet' },
  'tactical-shooter': { name: 'Tactical Shooter', hue: 'azure' },
  moba: { name: 'MOBA', hue: 'cyan' },
  fighting: { name: 'Fighting', hue: 'rose' },
  racing: { name: 'Racing', hue: 'orange' },
  strategy: { name: 'Strategy', hue: 'indigo' },
  'sports-sim': { name: 'Sports Sim', hue: 'magenta' },
  'card-game': { name: 'Card Game', hue: 'amber' },
  football: { name: 'Football', hue: 'mint' },
  basketball: { name: 'Basketball', hue: 'orange' },
  tennis: { name: 'Tennis', hue: 'lime' },
  volleyball: { name: 'Volleyball', hue: 'cyan' },
  chess: { name: 'Chess', hue: 'indigo' },
}

export const CATEGORY_SLUGS = Object.keys(CATEGORY_META)

/** The label a reader expects for a slug, falling back to a title-cased slug. */
export function categoryName(slug) {
  const known = CATEGORY_META[slug]
  if (known) return known.name

  return String(slug ?? '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** The artwork hue token for a slug. Unknown categories get the brand violet. */
export const categoryHue = (slug) => CATEGORY_META[slug]?.hue ?? 'violet'
