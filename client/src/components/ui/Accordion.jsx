import { useId, useState } from 'react'
import styles from './Accordion.module.css'

/**
 * A disclosure section.
 *
 * This is the whole reason `@mui/material` and both `@emotion` packages were in
 * the bundle — one accordion. The native pattern is a button that owns the
 * open state and an `aria-controls` pairing, which is this file.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {boolean} [props.defaultOpen]
 */
export function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const panelId = `${id}-panel`
  const buttonId = `${id}-button`

  return (
    <div className={`${styles.accordion} ${open ? styles.open : ''}`}>
      <h3 className={styles.heading}>
        <button
          type="button"
          id={buttonId}
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          <span>{title}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className={styles.panel}
      >
        {children}
      </div>
    </div>
  )
}
