import { post } from './client.js'

export const signUp = (credentials) => post('/api/auth/signup', credentials)

export const signIn = (credentials) => post('/api/auth/login', credentials)

export const signOut = () => post('/api/auth/logout')

export const forgotPassword = ({ email }) => post('/api/auth/forgot-password', { email })

export const resetPassword = ({ token, password }) =>
  post('/api/auth/reset-password', { token, password })
