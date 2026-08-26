import { BracketTree } from '/src/components/brand/index.js'
import { Button } from './Button.jsx'
import styles from './states.module.css'

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
    <span className={styles.spinner} role="status">
      <span className={styles.ring} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

/** A block-level placeholder for content that has not arrived yet. */
export function Skeleton({ height = '1rem', width = '100%', radius = 'var(--radius)' }) {
  return (
    <span
      className={styles.skeleton}
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export function LoadingState({ label = 'Loading', rows = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      <div className={styles.skeletons}>
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
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <BracketTree className={styles.backdrop} entrants={4} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{error?.message ?? 'Something went wrong. Please try again.'}</p>
      <div className={styles.actions}>
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
 * An empty state without a call to action is a dead end. The bracket behind it
 * is the one place the motif is allowed to be big: an empty page is exactly
 * where the product can afford to say what it is.
 */
export function EmptyState({ title, body, action }) {
  return (
    <div className={`${styles.state} ${styles.empty}`}>
      <BracketTree className={styles.backdrop} entrants={8} />
      <h2 className={styles.title}>{title}</h2>
      {body && <p className={styles.body}>{body}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  )
}
