import './Badge.css'

/**
 * A short status label.
 *
 * @param {object} props
 * @param {'neutral'|'accent'|'success'|'warning'|'danger'} [props.tone]
 */
export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
