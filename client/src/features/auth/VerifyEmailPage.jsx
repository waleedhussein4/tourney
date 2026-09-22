import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '/src/api/auth.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { BracketTree, Logo } from '/src/components/brand/index.js'
import { Button, Card, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { useAuth } from './useAuth.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './auth.module.css'

/** Reads the outcome of a verification link and reports it distinctly. */
export function VerifyEmailPage() {
  useDocumentTitle('Verify your email')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { refresh } = useAuth()
  const attempted = useRef(false)

  const verify = useMutation({
    mutationFn: () => verifyEmail({ token }),
    onSuccess: refresh,
  })

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true
    verify.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per token
  }, [token])

  if (!token) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="This link is missing its token"
          error={new Error('Request a new verification email and follow the link from there.')}
        />
      </PageShell>
    )
  }

  if (verify.isPending || verify.isIdle) {
    return (
      <PageShell width="narrow">
        <LoadingState label="Verifying your email" rows={2} />
      </PageShell>
    )
  }

  if (verify.isError) {
    const code = verify.error?.code
    const alreadyVerified = code === 'VERIFY_ALREADY_DONE'
    return (
      <PageShell width="narrow">
        <ErrorState
          title={alreadyVerified ? 'Already verified' : 'That link did not work'}
          error={
            new Error(
              alreadyVerified
                ? 'This email address was already verified.'
                : (verify.error?.message ?? 'That verification link is invalid or has expired.')
            )
          }
          action={
            <Link to="/">
              <Button variant="primary">Go home</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell width="narrow">
      <div className={styles.shell}>
        <BracketTree className={styles.tree} entrants={8} />
        <Logo size="lg" />

        <Card className={styles.card}>
          <h1 className={styles.title}>Email verified</h1>
          <p className={styles.subtitle}>Your email address is confirmed. You&apos;re all set.</p>
          <Link to="/">
            <Button variant="primary">Go home</Button>
          </Link>
        </Card>
      </div>
    </PageShell>
  )
}
