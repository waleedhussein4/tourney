import { del, post } from './client.js'

export const seedDemoData = () => post('/api/admin/seed')

export const clearDemoData = () => del('/api/admin/seed')
