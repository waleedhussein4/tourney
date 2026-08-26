import styles from './Badge.module.css'

/**
 * A short status label.
 *
 * @param {object} props
 * @param {'neutral'|'accent'|'success'|'warning'|'danger'} [props.tone]
 */
export function Badge({ tone = 'neutral', children }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
