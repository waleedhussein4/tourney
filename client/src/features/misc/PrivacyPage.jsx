import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { ContactEmail } from './ContactEmail.jsx'
import styles from './policy.module.css'

export function PrivacyPage() {
  return (
    <PageShell width="narrow">
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <div className={styles.prose}>
        <h2>Who runs this</h2>
        <p>
          Tourney (tourneylb.com) is operated by Walene HQ. Questions about your data:{' '}
          <ContactEmail />.
        </p>

        <h2>What we store</h2>
        <p>
          Your email address, username, and a hashed password — never your password itself. The
          tournaments, teams, brackets, and standings you create or join. Nothing more.
        </p>

        <h2>Cookies</h2>
        <p>
          One cookie: the session cookie that keeps you signed in. It is not used to track you
          across other sites. We do not run analytics and we do not load any third-party
          trackers.
        </p>

        <h2>Payment data</h2>
        <p>
          If you subscribe to hosting, your card is handled entirely by Paddle, our payment
          provider. We never see or store your card details.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your data or share it with advertisers. Tournament data you create —
          brackets, standings, team rosters — is visible to other users of the site by design,
          since that is what the service is for.
        </p>

        <h2>Deleting your data</h2>
        <p>
          Email <ContactEmail /> to have your account and its data removed.
        </p>
      </div>
    </PageShell>
  )
}
