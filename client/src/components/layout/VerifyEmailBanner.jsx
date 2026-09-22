import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { resendVerification } from '/src/api/auth.js'
import { useAuth } from '/src/features/auth/useAuth.js'
import styles from './DemoBanner.module.css'

const DISMISS_KEY = 'verifyEmailBannerDismissed'

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Nudges a signed-in, unverified account to confirm its email.
 *
 * Dismissal is per-tab (`sessionStorage`, not `localStorage`): the account is
 * still unverified next visit, and hiding it forever would bury the one thing
 * standing between the visitor and hosting a tournament.
 */
export function VerifyEmailBanner() {
  const { isAuthenticated, isEmailVerified } = useAuth()
  const [dismissed, setDismissed] = useState(readDismissed)

  const resend = useMutation({ mutationFn: resendVerification })

  if (!isAuthenticated || isEmailVerified || dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // Private browsing or a full quota — the banner still closes this visit.
    }
  }

  return (
    <div className={styles.banner} role="note">
      <p className={styles.text}>
        {resend.isSuccess
          ? 'Verification email sent — check your inbox.'
          : 'Verify your email to become a host.'}
        {resend.isError && ` ${resend.error.message}`}
      </p>
      {!resend.isSuccess && (
        <button
          type="button"
          className={`${styles.dismiss} ${styles.resend}`}
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
        >
          {resend.isPending ? 'Sending…' : 'Resend'}
        </button>
      )}
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
