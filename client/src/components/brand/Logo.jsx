import { BracketMark } from './BracketMark.jsx'
import styles from './Logo.module.css'

const MARK_SIZE = { sm: 22, md: 26, lg: 44 }

/**
 * The wordmark: the bracket glyph, then "Tourney" in the display face.
 *
 * The name is real text rather than an outlined path, so it is selectable,
 * searchable, and scales with the reader's font size. `public/brand/` carries
 * the same lockup as a standalone SVG for the README and other surfaces that
 * cannot run the app.
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {'dark'|'light'} [props.tone] Which background it is sitting on.
 */
export function Logo({ size = 'md', tone = 'dark', className = '' }) {
  return (
    <span
      className={`${styles.logo} ${styles[size]} ${tone === 'light' ? styles.onLight : ''} ${className}`}
    >
      <BracketMark size={MARK_SIZE[size]} className={styles.mark} />
      Tourney
    </span>
  )
}
