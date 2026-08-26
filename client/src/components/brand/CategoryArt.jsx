import { useId } from 'react'
import {
  Basketball,
  BattleRoyale,
  CardGame,
  Chess,
  Fighting,
  Football,
  Moba,
  Racing,
  SportsSim,
  Strategy,
  TacticalShooter,
  Tennis,
  Volleyball,
} from './categoryFigures.jsx'
import { categoryHue, categoryName } from './categories.js'
import styles from './CategoryArt.module.css'

/** Slug to figure. A category with no figure gets the wash and the name alone. */
const FIGURES = {
  'battle-royale': BattleRoyale,
  'tactical-shooter': TacticalShooter,
  moba: Moba,
  fighting: Fighting,
  racing: Racing,
  strategy: Strategy,
  'sports-sim': SportsSim,
  'card-game': CardGame,
  football: Football,
  basketball: Basketball,
  tennis: Tennis,
  volleyball: Volleyball,
  chess: Chess,
}

/**
 * The artwork for a category: an abstract figure in the category's hue, the
 * name set in the display face, and the bracket motif in the corner.
 *
 * This is what replaced the original's cover images, which were hotlinked
 * screenshots of commercial games. Everything here is drawn from the token
 * palette, ships in the bundle, and is ours.
 *
 * The whole card is one `<svg>` so it scales to any panel without a raster
 * asset, and it is decorative by default: the category name is always present
 * as real text elsewhere in the card, so announcing it twice would only be
 * noise. Pass `labelled` where the art stands alone.
 *
 * The panel it fills is almost always a different shape from the artwork, so
 * the art is cropped to cover. Which edge it holds on to depends on the shape:
 * a card is anchored to its bottom, because the name must survive the crop; a
 * wide banner is centred, because the name is not the point there — the page
 * has a title of its own.
 *
 * @param {object} props
 * @param {string} props.slug
 * @param {'card'|'banner'} [props.variant]
 * @param {boolean} [props.labelled] Expose the name to assistive technology.
 */
export function CategoryArt({ slug, variant = 'card', labelled = false, className = '' }) {
  const id = useId()
  const name = categoryName(slug)
  const Figure = FIGURES[slug]

  return (
    <svg
      className={`${styles.art} ${className}`}
      viewBox="0 0 320 180"
      preserveAspectRatio={variant === 'banner' ? 'xMidYMid slice' : 'xMidYMax slice'}
      style={{ '--art-hue': `var(--art-${categoryHue(slug)})` }}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? `${name} artwork` : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--art-hue) 34%, var(--ink-950))" />
          <stop offset="0.55" stopColor="color-mix(in srgb, var(--art-hue) 13%, var(--ink-950))" />
          <stop offset="1" stopColor="var(--ink-950)" />
        </linearGradient>
        {/* Keeps the name legible over the brightest corner of the wash. */}
        <linearGradient id={`${id}-scrim`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--ink-950)" stopOpacity="0.85" />
          <stop offset="1" stopColor="var(--ink-950)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="320" height="180" fill={`url(#${id}-wash)`} />

      {Figure && (
        <g className={styles.figure}>
          <Figure />
        </g>
      )}

      {/* A card has to name itself. A banner does not: the page it sits behind
          has a title, a category badge, and no room for a third label. */}
      {variant === 'card' && <rect y="96" width="320" height="84" fill={`url(#${id}-scrim)`} />}

      <g className={styles.watermark} opacity="0.34">
        <path
          d="M288 20h8v16h-8"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M296 28h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {variant === 'card' && (
        <text className={styles.name} x="20" y="156" fontSize="19">
          {name}
        </text>
      )}
    </svg>
  )
}
