import { Nav } from './Nav.jsx'
import styles from './PageShell.module.css'

/**
 * The frame every page sits in: skip link, nav, and a centred main column.
 *
 * `main` carries the id the skip link targets, so keyboard users can jump past
 * the navigation on every page without each page remembering to allow it.
 *
 * @param {object} props
 * @param {'default'|'wide'|'narrow'} [props.width]
 */
export function PageShell({ width = 'default', children }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main
        id="main"
        className={`${styles.page} ${width === 'default' ? '' : styles[width]}`}
        tabIndex={-1}
      >
        {children}
      </main>
    </>
  )
}

/**
 * A page title with optional eyebrow, supporting line, and trailing actions.
 *
 * @param {object} props
 * @param {string} [props.eyebrow] Where in the app the reader is.
 */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className={styles.header}>
      <div>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
