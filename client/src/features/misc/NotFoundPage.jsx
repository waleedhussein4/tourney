import { PageShell } from '/src/components/layout/PageShell.jsx'
import { BracketTree } from '/src/components/brand/index.js'
import { ButtonLink } from '/src/components/ui/index.js'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <PageShell width="narrow">
      <div className={styles.page}>
        <BracketTree className={styles.tree} entrants={8} />

        <p className={styles.code}>404</p>
        <h1 className={styles.title}>This one did not advance</h1>
        <p className={styles.body}>
          The link may be out of date, or the tournament may have been cancelled.
        </p>

        <div className={styles.actions}>
          <ButtonLink variant="primary" to="/tournaments">
            Browse tournaments
          </ButtonLink>
          <ButtonLink variant="ghost" to="/">
            Go home
          </ButtonLink>
        </div>
      </div>
    </PageShell>
  )
}
