import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * An accessible dialog.
 *
 * Replaces the hand-built popups the original assembled with
 * `document.createElement`, and the `window.confirm` calls it used for
 * destructive actions. It closes on Escape and on a click outside, keeps focus
 * inside while open, and hands focus back to whatever opened it on close.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.title Announced as the dialog's accessible name.
 * @param {React.ReactNode} [props.footer] Actions, laid out at the end.
 */
export function Modal({ open, onClose, title, description, footer, children }) {
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  // Remember what had focus, so it can be given back on close.
  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement
    return () => returnFocusRef.current?.focus?.()
  }, [open])

  // Move focus into the dialog once it exists.
  useEffect(() => {
    if (!open) return
    const first = dialogRef.current?.querySelector(FOCUSABLE)
    ;(first ?? dialogRef.current)?.focus()
  }, [open])

  // The page behind must not scroll while a dialog is over it.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      // Focus trap: wrap from the last control back to the first and vice versa,
      // so Tab can never land on the page behind the dialog.
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  if (!open) return null

  return createPortal(
    <div
      className="modal__backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      {/* The keydown handler here is the focus trap and the Escape key, not a
          control — the dialog itself is what receives them. */}
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className="modal__header">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </header>

        {description && (
          <p className="modal__description" id={descriptionId}>
            {description}
          </p>
        )}

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
