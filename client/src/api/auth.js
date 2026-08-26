import { post } from './client.js'

export const signUp = (credentials) => post('/api/auth/signup', credentials)

export const signIn = (credentials) => post('/api/auth/login', credentials)

export const signOut = () => post('/api/auth/logout')
