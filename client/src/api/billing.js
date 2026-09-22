import { get, post } from './client.js'

/** The price list, for anyone — the hosts landing page quotes it while signed out. */
export const getPlan = () => get('/api/billing/plan')

/** What this account may do, and what it would cost to do more. */
export const getMyBilling = () => get('/api/billing/me')

/** Opens a checkout for the subscription. */
export const startCheckout = () => post('/api/billing/checkout')

export const billingKeys = {
  plan: ['billing', 'plan'],
  me: ['billing', 'me'],
}
