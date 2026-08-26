import { forwardRef, useId } from 'react'
import styles from './Field.module.css'

/**
 * A labelled form control.
 *
 * The label is always rendered and always tied to its input — `useId` generates
 * the pairing so callers cannot forget it — and the error is announced rather
 * than only coloured red.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.error] Message from validation, shown beneath.
 * @param {string} [props.hint] Guidance shown when there is no error.
 * @param {(props: {id: string, describedBy?: string, invalid: boolean}) => React.ReactNode} props.children
 */
export function Field({ label, error, hint, required = false, children }) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className={`${styles.field} ${error ? styles.invalid : ''}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/*
 * These forward their ref.
 *
 * react-hook-form registers an uncontrolled input by holding a ref to it: that
 * is how it writes the initial value in and reads the current one back out. A
 * plain function component silently drops a `ref` prop, which leaves every
 * pre-filled form rendering blank — and then saving it would write those blanks
 * back over the real data.
 */

export const Input = forwardRef(function Input(
  { describedBy, invalid, className = '', ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`${styles.control} ${className}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})

export const Textarea = forwardRef(function Textarea(
  { describedBy, invalid, className = '', ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`${styles.control} ${styles.multiline} ${className}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})

export const Select = forwardRef(function Select(
  { describedBy, invalid, className = '', children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={`${styles.control} ${className}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  )
})

/**
 * A checkbox and its label, as one click target.
 *
 * A bare `<input type="checkbox">` with a sibling `<label>` is the shape that
 * most often ends up unlabelled; wrapping it means the pairing cannot be
 * forgotten and the words are part of the hit area.
 */
export const Checkbox = forwardRef(function Checkbox({ label, className = '', ...rest }, ref) {
  return (
    <label className={`${styles.checkbox} ${className}`}>
      <input type="checkbox" ref={ref} {...rest} />
      {label}
    </label>
  )
})
