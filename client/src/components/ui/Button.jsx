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
