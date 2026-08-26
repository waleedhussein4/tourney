// Seeds demo users and tournaments into the configured database.
// Usage: npm run seed  (from the repo root or the server workspace)
//
// Phase 3 of PLAN.md replaces this with a richer, idempotent seed.

/* eslint-disable no-console -- this script's output is its user interface. */

import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import { createUsers } from './generateTestUsers.js'
import { createTournaments } from './generateTestTournaments.js'

async function seed() {
  await connectToDatabase()
  console.log('Connected. Seeding demo users and tournaments...')

  await createUsers()
  await createTournaments()

  console.log('Seed complete.')
  await disconnectFromDatabase()
}

seed().catch(async (error) => {
  console.error('Seed failed:', error)
  await disconnectFromDatabase().catch(() => {})
  process.exitCode = 1
})
