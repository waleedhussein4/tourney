/**
 * The bracket glyph: two entrants, a spine, one advancing line, one seat in the
 * next round. It is the app's signature motif and the logo's mark.
 *
 * Drawn on a 32x32 grid in `currentColor`, so it takes the colour of whatever
 * it sits in; only the advancing node is painted, in the accent.
 *
 * @param {object} props
 * @param {number} [props.size] Rendered edge length, in pixels.
 * @param {string} [props.title] Give it one to expose the mark to assistive
 *   technology; leave it out and the mark is hidden as decoration.
 */
export function BracketMark({ size = 32, title, className = '', ...rest }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {/* Two entrants folding into one spine. */}
      <path
        d="M3 7h9v18H3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The winner advancing. */}
      <path d="M12 16h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* The seat in the next round. */}
      <circle cx="26" cy="16" r="3.25" fill="var(--violet-500, #7c5cff)" />
    </svg>
  )
}
