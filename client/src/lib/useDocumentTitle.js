import { useEffect } from 'react'

const SUFFIX = ' — Tourney'

/**
 * Sets `document.title` for the page it is called from, and restores the
 * previous title on unmount so a lazy-loaded page never leaves its title
 * behind after the user navigates away.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title}${SUFFIX}` : 'Tourney'
    return () => {
      document.title = previous
    }
  }, [title])
}
