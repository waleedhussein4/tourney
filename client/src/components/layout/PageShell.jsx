import { Nav } from './Nav.jsx'
import './PageShell.css'

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
      <main id="main" className={`page page--${width}`} tabIndex={-1}>
        {children}
      </main>
    </>
  )
}

/** A page title with optional supporting line and trailing actions. */
export function PageHeader({ title, description, actions }) {
  return (
    <header className="page__header">
      <div>
        <h1>{title}</h1>
        {description && <p className="page__description">{description}</p>}
      </div>
      {actions && <div className="page__header-actions">{actions}</div>}
    </header>
  )
}
