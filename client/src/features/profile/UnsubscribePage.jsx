import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { unsubscribe } from '/src/api/notifications.js'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button, Card, ErrorState, LoadingState } from '/src/components/ui/index.js'
import { useDocumentTitle } from '/src/lib/useDocumentTitle.js'
import styles from './profile.module.css'

const CATEGORY_LABELS = {
  matchScheduled: 'match scheduled emails',
  matchStartingSoon: 'match starting soon emails',
  resultDisputed: 'result disputed emails',
  applicationDecided: 'application decided emails',
}

/**
 * Landing page for the one-click unsubscribe link in every category email.
 * Works signed out — the request carries its own signed token, not a session.
 */
export function UnsubscribePage() {
  useDocumentTitle('Unsubscribe')
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const category = searchParams.get('category')
  const token = searchParams.get('token')
  const attempted = useRef(false)

  const request = useMutation({ mutationFn: () => unsubscribe({ userId, category, token }) })

  useEffect(() => {
    if (!userId || !category || !token || attempted.current) return
    attempted.current = true
    request.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per link
  }, [userId, category, token])

  if (!userId || !category || !token) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="This link is missing something"
          error={new Error('Open your profile to manage your notification preferences instead.')}
          action={
            <Link to="/profile">
              <Button variant="primary">Go to preferences</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }

  if (request.isPending || request.isIdle) {
    return (
      <PageShell width="narrow">
        <LoadingState label="Turning that off" rows={2} />
      </PageShell>
    )
  }

  if (request.isError) {
    return (
      <PageShell width="narrow">
        <ErrorState
          title="That link did not work"
          error={new Error(request.error?.message ?? 'That unsubscribe link is invalid.')}
          action={
            <Link to="/profile">
              <Button variant="primary">Go to preferences</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }

  const label = CATEGORY_LABELS[category] ?? 'those emails'

  return (
    <PageShell width="narrow">
      <Card className={styles.section}>
        <h1>You&apos;re unsubscribed</h1>
        <p>You won&apos;t get {label} anymore. You&apos;ll still see them in-app.</p>
        <Link to="/profile" className={styles.link}>
          Manage all your notification preferences
        </Link>
      </Card>
    </PageShell>
  )
}
