import { Link } from 'react-router-dom'
import styles from './Button.module.css'

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant]
 * @param {'sm'|'md'} [props.size]
 * @param {boolean} [props.loading] Shows a spinner and blocks further clicks.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || loading}
      // Tells a screen reader the control is working rather than broken.
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

/**
 * A link that looks like a button.
 *
 * "Browse tournaments" on the home page navigates, so it has to be an anchor —
 * a `<button>` that calls `navigate` is a link that middle-click, Ctrl-click
 * and "open in new tab" cannot use. This is the same styling on the right
 * element.
 */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  return (
    <Link className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`} {...rest}>
      {children}
    </Link>
  )
}
