import { PageHeader, PageShell } from '/src/components/layout/PageShell.jsx'
import { ContactEmail } from './ContactEmail.jsx'
import { POLICY_PAGES } from '/src/content/policyContent.js'
import styles from './policy.module.css'

function Part({ part }) {
  if (typeof part === 'string') return part
  if (part.type === 'contact') return <ContactEmail />
  return <a href={part.href}>{part.text}</a>
}

/** Renders one of `POLICY_PAGES` (terms/privacy/refunds) from the shared content. */
export function PolicyPage({ pageKey }) {
  const page = POLICY_PAGES[pageKey]
  return (
    <PageShell width="narrow">
      <PageHeader eyebrow="Legal" title={page.title} />
      <div className={styles.prose}>
        {page.sections.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i}>
                {paragraph.map((part, j) => (
                  <Part key={j} part={part} />
                ))}
              </p>
            ))}
          </div>
        ))}
      </div>
    </PageShell>
  )
}
