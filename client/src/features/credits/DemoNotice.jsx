import styles from './credits.module.css'

/**
 * Says plainly that the checkout is not real.
 *
 * This is a portfolio project, and a payment form that does not say so is a
 * payment form pretending to take money. It appears on both the catalogue and
 * the checkout, not just at the point of purchase.
 */
export function DemoNotice() {
  return (
    <p className={styles.demoNotice} role="note">
      <strong>Demo mode.</strong> This is a portfolio project — no real payment is processed and no
      card details ever leave your browser. Use any fake card number; the credits are granted
      straight away.
    </p>
  )
}
