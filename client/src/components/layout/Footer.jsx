import { Link } from 'react-router-dom'
import { ContactEmail } from '../../features/misc/ContactEmail.jsx'
import styles from './Footer.module.css'

const LINKS = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/refunds', label: 'Refunds' },
]

/**
 * The legal and contact links every page in the app shell carries, so a
 * reviewer (or a player) is never more than one click from the policies that
 * govern the site or from a way to reach a human. `/hosts` renders outside
 * `PageShell` and does not get this footer — it has its own minimal shell,
 * and its own contact link in the closing section.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Legal and contact">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
        <ContactEmail label="Contact" />
        <a href="https://github.com/waleedhussein4/tourney" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </footer>
  )
}
