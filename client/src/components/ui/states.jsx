import { Button } from './Button.jsx'
import './states.css'

/**
 * The three things every page has to be able to say: I am working on it, I
 * could not do it, or there is nothing here yet.
 *
 * They live together because a page that has one and not the others is a page
 * that will eventually show a blank screen to somebody.
 */

/** A spinner with an accessible label. */
export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner" role="status">
      <span className="spinner__ring" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

/** A block-level placeholder for content that has not arrived yet. */
export function Skeleton({ height = '1rem', width = '100%', radius = 'var(--radius-sm)' }) {
  return (
    <span className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />
  )
}

export function LoadingState({ label = 'Loading', rows = 3 }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      <div className="state__skeletons">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} height="4.5rem" />
        ))}
      </div>
    </div>
  )
}

/**
 * A failure the reader can act on: what happened, and what to do about it.
 *
 * @param {object} props
 * @param {Error} [props.error] Its message is shown; it is the API's, not a stack.
 * @param {() => void} [props.onRetry]
 */
export function ErrorState({ title = 'That did not work', error, onRetry, action }) {
  return (
    <div className="state state--error" role="alert">
      <h2 className="state__title">{title}</h2>
      <p className="state__body">{error?.message ?? 'Something went wrong. Please try again.'}</p>
      <div className="state__actions">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}

/**
 * Nothing here yet — with the thing to do about it.
 *
 * An empty state without a call to action is a dead end.
 */
export function EmptyState({ title, body, action }) {
  return (
    <div className="state state--empty">
      <h2 className="state__title">{title}</h2>
      {body && <p className="state__body">{body}</p>}
      {action && <div className="state__actions">{action}</div>}
    </div>
  )
}
