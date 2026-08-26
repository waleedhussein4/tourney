import styles from './BracketRule.module.css'

/**
 * A section divider carrying the bracket motif: the connector, an optional
 * label, and a line that fades out.
 *
 * Used instead of a bare `<hr>` wherever a page changes subject, which is the
 * restrained end of the motif — the glyph is 18px and appears once per section.
 *
 * @param {object} props
 * @param {string} [props.label] Set as a small cap on the rule.
 */
export function BracketRule({ label, className = '' }) {
  return (
    <div className={`${styles.rule} ${className}`} role="presentation">
      <svg
        className={styles.glyph}
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 3h6v12H2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 9h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
      <hr className={styles.line} />
    </div>
  )
}
