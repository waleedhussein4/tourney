// Loaded here rather than in App, so the Arabic face is fetched only by the one
// page that can render Arabic — every other visitor never pays for it.
import '@fontsource-variable/noto-sans-arabic'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublishingPricing, publishingKeys } from '/src/api/publishing.js'
import { BracketTree } from '/src/components/brand/index.js'
import { COPY, LANGUAGES, directionOf } from './copy.js'
import styles from './HostsPage.module.css'

const STORED_LANGUAGE = 'tourney.hosts.language'

/**
 * The page a tournament host lands on.
 *
 * The only page in the app written for someone who has not signed up, and the
 * only one in Arabic — the hosts it is aimed at are in Beirut, and half of them
 * would rather read this in Arabic than in English. It is deliberately outside
 * the app shell: no nav, no account bar, nothing to click but the two things
 * this page is for.
 */
export function HostsPage() {
  const [language, setLanguage] = useState(initialLanguage)
  const pricing = useQuery({
    queryKey: publishingKeys.pricing,
    queryFn: getPublishingPricing,
  })
  const mailto = pricing.data?.contactEmail ? `mailto:${pricing.data.contactEmail}` : null
  const direction = directionOf(language)
  const t = COPY[language]

  // The whole document, not a wrapper: `dir` on an ancestor is what makes the
  // browser mirror scrollbars, text selection and the caret too, and this page
  // has no app chrome around it to disagree with.
  useEffect(() => {
    const root = document.documentElement
    const previous = { lang: root.lang, dir: root.dir }
    root.lang = language
    root.dir = direction
    document.title = t.documentTitle
    try {
      localStorage.setItem(STORED_LANGUAGE, language)
    } catch {
      // A browser with storage blocked still gets the language it picked; it
      // just will not be remembered. That is not worth failing the page over.
    }
    return () => {
      root.lang = previous.lang
      root.dir = previous.dir || 'ltr'
    }
  }, [language, direction, t.documentTitle])

  const other = LANGUAGES.find((entry) => entry.code !== language)

  return (
    <div className={styles.page} lang={language} dir={direction}>
      <header className={styles.top}>
        <Link to="/" className={styles.wordmark}>
          Tourney
        </Link>
        <button
          type="button"
          className={styles.language}
          onClick={() => setLanguage(other.code)}
          lang={other.code}
          aria-label={t.switchLabel}
        >
          {t.switchTo}
        </button>
      </header>

      <section className={styles.hero}>
        <BracketTree className={styles.heroArt} entrants={8} />
        <div className={styles.heroBody}>
          <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
          <p className={styles.heroLead}>{t.heroBody}</p>
          <div className={styles.heroActions}>
            {mailto && (
              <a className={styles.primary} href={mailto}>
                {t.heroAction}
              </a>
            )}
            <Link className={styles.secondary} to="/tournaments">
              {t.heroSecondary}
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.stepsTitle}</h2>
        <ol className={styles.steps}>
          {t.steps.map((step) => (
            <li key={step.title} className={styles.step}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.screenshotsTitle}</h2>
        <div className={styles.shots}>
          {t.shots.map((shot) => (
            <figure key={shot.src} className={styles.shot}>
              <img src={shot.src} alt={shot.caption} loading="lazy" width="1280" height="800" />
              <figcaption>{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Pricing t={t} tiers={pricing.data?.tiers} />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.faqTitle}</h2>
        <dl className={styles.faq}>
          {t.faq.map((entry) => (
            <div key={entry.q} className={styles.faqItem}>
              <dt className={styles.faqQuestion}>{entry.q}</dt>
              <dd className={styles.faqAnswer}>{entry.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.closing}>
        <h2 className={styles.closingTitle}>{t.closingTitle}</h2>
        <p className={styles.closingBody}>{t.closingBody}</p>
        {mailto && (
          <a className={styles.primary} href={mailto}>
            {t.closingAction}
          </a>
        )}
      </section>
    </div>
  )
}

/**
 * The price list, read from the server.
 *
 * The prices live in one config file — quoting them here from a hard-coded copy
 * is exactly how the page and the checkout would come to disagree.
 */
function Pricing({ t, tiers }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t.pricingTitle}</h2>
      <p className={styles.sectionLead}>{t.pricingBody}</p>

      {tiers && (
        <table className={styles.prices}>
          <thead>
            <tr>
              <th scope="col">{t.tierHeading}</th>
              <th scope="col">{t.priceHeading}</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.tier}>
                <th scope="row">{t.upTo(formatNumber(tier.maxCapacity))}</th>
                <td>{tier.amountCents === 0 ? t.free : t.price(formatMoney(tier.amountCents))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className={styles.bigger}>
        <strong>{t.biggerTitle}</strong> {t.biggerBody}
      </p>
    </section>
  )
}

/** Dollars from cents, isolated so Arabic does not reorder the amount. */
function formatMoney(cents) {
  return `⁨$${(cents / 100).toLocaleString('en-US')}⁩`
}

/**
 * Grouped western digits, isolated from the text around them.
 *
 * U+2068 and U+2069 fence the number off from the bidirectional algorithm, so
 * "150,000 ل.ل." keeps its comma and its order inside an Arabic sentence
 * instead of being reordered around the surrounding right-to-left run.
 */
function formatNumber(value) {
  return `⁨${value.toLocaleString('en-US')}⁩`
}

function initialLanguage() {
  try {
    const stored = localStorage.getItem(STORED_LANGUAGE)
    if (stored && LANGUAGES.some((entry) => entry.code === stored)) return stored
  } catch {
    // Unreadable storage is the same as no preference.
  }
  return navigator.language?.startsWith('ar') ? 'ar' : 'en'
}
