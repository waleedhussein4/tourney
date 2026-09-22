import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { ContactEmail } from './ContactEmail.jsx'
import styles from './policy.module.css'

export function RefundsPage() {
  return (
    <PageShell width="narrow">
      <PageHeader eyebrow="Legal" title="Refunds" />
      <div className={styles.prose}>
        <h2>Hosting subscription</h2>
        <p>
          The hosting subscription is $5/month, charged by Paddle, who acts as merchant of record
          for the transaction. You can cancel at any time from the{' '}
          <a href="/billing">billing page</a> — cancelling stops future charges but does not refund
          the current period automatically.
        </p>

        <h2>Refund window</h2>
        <p>
          If you are charged and want a refund, email <ContactEmail /> within 14 days of the charge
          and we will refund it.
        </p>
      </div>
    </PageShell>
  )
}
