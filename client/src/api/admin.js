import { del, get, post } from './client.js'

export const seedDemoData = () => post('/api/admin/seed')

export const clearDemoData = () => del('/api/admin/seed')

// --- publishing payments ------------------------------------------------------

/** Every tournament waiting on a Whish transfer, newest first. */
export const listPublishRequests = () => get('/api/admin/publish-requests')

/** The money arrived. `whishRef` is whatever identifies the transfer. */
export const confirmPublishRequest = (id, whishRef) =>
  post(`/api/admin/publish-requests/${id}/confirm`, whishRef ? { whishRef } : {})

/** It did not. The tournament goes back to a draft its host can resubmit. */
export const rejectPublishRequest = (id, reason) =>
  post(`/api/admin/publish-requests/${id}/reject`, reason ? { reason } : {})

export const publishRequestKeys = {
  pending: ['admin', 'publish-requests'],
}
