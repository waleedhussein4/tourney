import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import styles from './policy.module.css'

export function TermsPage() {
  return (
    <PageShell width="narrow">
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <div className={styles.prose}>
        <h2>The service</h2>
        <p>
          Tourney (tourneylb.com) is a tool for organizing and tracking tournaments. It lets a
          host create a bracket or battle-royale tournament, take sign-ups from players or teams,
          run rounds, and record standings. That is the whole of what the site does.
        </p>

        <h2>Entry fees and prizes</h2>
        <p>
          Entry fees and prizes are arranged directly between hosts and players, outside the site.
          Tourney displays the amounts a host declares — an entry fee, a prize pool — but it never
          collects, holds, or pays out any of that money. Any dispute over an entry fee or a prize
          is between the host and the player.
        </p>

        <h2>Accounts</h2>
        <p>
          You are responsible for what happens under your account. Keep your password to
          yourself, and tell us at{' '}
          <a href="mailto:contact@walenehq.com">contact@walenehq.com</a> if you think someone
          else has access to it.
        </p>

        <h2>Hosting subscription</h2>
        <p>
          Hosting more than the free plan&rsquo;s live tournaments requires a $5/month subscription,
          billed by Paddle as merchant of record. See the{' '}
          <a href="/refunds">refunds page</a> for cancellation and refund terms.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms as the service changes. Continuing to use the site after a
          change means you accept the update.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:contact@walenehq.com">contact@walenehq.com</a>.
        </p>
      </div>
    </PageShell>
  )
}
