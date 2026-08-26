import { useEffect, useState } from 'react'

/**
 * Follows `value`, but only after it has stopped changing for `delay`.
 *
 * Used for the browse search box: typing eight characters should be one request,
 * not eight.
 */
export function useDebounced(value, delay = 350) {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
