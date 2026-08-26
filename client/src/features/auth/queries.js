import { getCurrentUser } from '/src/api/users.js'

export const currentUserKey = ['currentUser']

/**
 * Reads the signed-in user.
 *
 * A 401 is the signed-out answer, not a failure, so it resolves to `null`
 * rather than throwing. The endpoint it replaced answered a bare `true`/`false`,
 * which meant an error body was itself truthy — and every `if (isHost)` built on
 * it read a signed-out visitor as a host.
 */
export async function fetchCurrentUser() {
  try {
    const { user } = await getCurrentUser()
    return user
  } catch (error) {
    if (error.isUnauthorized) return null
    throw error
  }
}
