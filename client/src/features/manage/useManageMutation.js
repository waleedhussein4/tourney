import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { tournamentKeys } from '/src/api/tournaments.js'
import { currentUserKey } from '/src/features/auth/queries.js'

/**
 * A host action against one tournament.
 *
 * Every one of them changes something on this page, and several move credits, so
 * they all invalidate the same two queries: the tournament and the signed-in
 * user. That is what replaces the `navigate(0)` full-page reload the original
 * fired after each action — the data that changed is refetched, the scroll
 * position and any open dialog are not thrown away.
 *
 * @param {object} options
 * @param {string} options.tournamentId
 * @param {(variables: unknown) => Promise<unknown>} options.mutationFn
 * @param {string} [options.success] Toast shown when it works.
 * @param {() => void} [options.onDone]
 */
export function useManageMutation({ tournamentId, mutationFn, success, onDone }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.manage(tournamentId) })
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) })
      queryClient.invalidateQueries({ queryKey: currentUserKey })
      if (success) toast.success(success)
      onDone?.()
    },
    // The API's message says what went wrong in the host's terms — "the bank
    // holds 40 of the 60 credits in prizes" — so it is shown as-is.
    onError: (error) => toast.error(error.message),
  })
}
