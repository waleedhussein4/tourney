import { useState } from 'react'
import styles from './DemoBanner.module.css'

const DISMISS_KEY = 'demoBannerDismissed'

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

/** Slim top banner reminding a visitor that demo data resets daily. */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(readDismissed)

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // Private browsing or a full quota — the banner still closes this visit.
    }
  }

  return (
    <div className={styles.banner} role="note">
      <p className={styles.text}>Demo data resets every day at 04:00 UTC.</p>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
