import * as Sentry from '@sentry/react'
import { Router } from './app/router.jsx'
import { PageShell } from '/src/components/layout/PageShell.jsx'
import { Button } from '/src/components/ui/index.js'
import styles from '/src/features/misc/NotFoundPage.module.css'

// Self-hosted variable fonts. Archivo is pulled with its width axis, which the
// display styles use to set headings slightly expanded.
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/instrument-sans'

import './styles/globals.css'

/**
 * Fallback for the app's single top-level error boundary. Reuses the 404
 * page's visual language (same module, different copy) rather than inventing
 * a second "something broke" look.
 */
function ErrorFallback() {
  return (
    <PageShell width="narrow">
      <div className={styles.page}>
        <p className={styles.code}>Error</p>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.body}>
          The page hit an unexpected error. Reloading usually fixes it.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <Router />
    </Sentry.ErrorBoundary>
  )
}
