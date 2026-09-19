import { get } from './client.js'

/** The public price list. The payment number is not in it — that is host-only. */
export const getPublishingPricing = () => get('/api/publishing/pricing')

export const publishingKeys = {
  pricing: ['publishing', 'pricing'],
}
