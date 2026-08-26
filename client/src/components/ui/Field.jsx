import { useId } from 'react'
import './Field.css'

/**
 * A labelled form control.
 *
 * The label is always rendered and always tied to its input — `useId` generates
 * the pairing so callers cannot forget it, and the error is announced rather
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
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** The bare input, for use inside a `Field` render prop. */
export function Input({ describedBy, invalid, className = '', ...rest }) {
  return (
    <input
      className={`control ${className}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

export function Textarea({ describedBy, invalid, className = '', ...rest }) {
  return (
    <textarea
      className={`control control--multiline ${className}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

export function Select({ describedBy, invalid, className = '', children, ...rest }) {
  return (
    <select
      className={`control ${className}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  )
}
