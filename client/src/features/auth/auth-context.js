import { createContext } from 'react'

/**
 * @typedef {object} AuthValue
 * @property {{id: string, username: string, email: string, credits: number,
 *            isHost: boolean, isAdmin: boolean} | null} user
 *   The signed-in user, or `null` when signed out. Never `undefined` once
 *   `isLoading` is false.
 * @property {boolean} isLoading True until the first identity check resolves.
 * @property {boolean} isAuthenticated
 * @property {boolean} isHost
 * @property {boolean} isAdmin
 * @property {() => Promise<unknown>} refresh Re-reads the identity.
 * @property {() => Promise<void>} logout
 */

export const AuthContext = createContext(null)
