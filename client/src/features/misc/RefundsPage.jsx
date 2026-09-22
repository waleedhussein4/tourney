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

        <h2>Entry fees</h2>
        <p>
          Entry fees and prizes are arranged directly between hosts and players — the site never
          collects or holds that money, so we cannot refund an entry fee. Refund requests for an
          entry fee should go to the host who ran the tournament.
        </p>
      </div>
    </PageShell>
  )
}
