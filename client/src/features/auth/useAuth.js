import { useContext } from 'react'
import { AuthContext } from './auth-context.js'

/**
 * The signed-in user and what they may do.
 *
 * @returns {import('./auth-context.js').AuthValue}
 */
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
