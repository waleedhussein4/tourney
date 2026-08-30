import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { signOut } from '/src/api/auth.js'
import { AuthContext } from './auth-context.js'
import { currentUserKey, fetchCurrentUser } from './queries.js'

/**
 * Holds the answer to "who is this?" for the whole app.
 *
 * One query, cached by React Query, so the nav bar, the route guards, and any
 * page that needs the user all read the same value and all update together when
 * it changes — no page-level `useEffect` re-fetching, and no way for two parts
 * of the screen to disagree about whether someone is signed in.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()

  const { data: user, isPending } = useQuery({
    queryKey: currentUserKey,
    queryFn: fetchCurrentUser,
    // Being signed out is a perfectly good answer; retrying it wastes requests
    // and delays the first paint of every guarded route.
    retry: false,
    staleTime: 30_000,
  })

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: currentUserKey }),
    [queryClient]
  )

  const logout = useCallback(async () => {
    await signOut()

    // Answer the identity query first. It is the one the whole app renders from,
    // and it has a live observer in this component — `queryClient.clear()`
    // destroys the cache entry that observer is attached to, so a `setQueryData`
    // afterwards seeds a *new* entry that nothing is listening to. The nav then
    // goes on showing the signed-out user until something forces a re-render,
    // which is a sign-out button that visibly does nothing.
    queryClient.setQueryData(currentUserKey, null)

    // Then drop everything else: it was all fetched as the previous user, and
    // none of it should survive into the next session.
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== currentUserKey[0],
    })
  }, [queryClient])

  const value = useMemo(
    () => ({
      user: user ?? null,
      isLoading: isPending,
      isAuthenticated: Boolean(user),
      isHost: Boolean(user?.isHost),
      isAdmin: Boolean(user?.isAdmin),
      refresh,
      logout,
    }),
    [user, isPending, refresh, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
