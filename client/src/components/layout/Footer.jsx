import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const LINKS = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/refunds', label: 'Refunds' },
]

/**
 * The legal links every page in the app shell carries, so a reviewer (or a
 * player) is never more than one click from the policies that govern the
 * site. `/hosts` renders outside `PageShell` and does not get this footer —
 * it has its own minimal shell.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Legal">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
        <a href="https://github.com/waleedhussein4/tourney-rewrite" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </footer>
  )
}
