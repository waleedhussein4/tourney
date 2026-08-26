// Seeds demo users and tournaments into the configured database.
// Usage: npm run seed  (from the repo root or the server workspace)
//
// Phase 3 of PLAN.md replaces this with a richer, idempotent seed.

require('dotenv').config()

const mongoose = require('mongoose')
const { createUsers } = require('./generateTestUsers')
const { createTournaments } = require('./generateTestTournaments')

async function seed() {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    console.error('DATABASE_URL is not set. Copy server/.env.example to server/.env first.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('Connected. Seeding demo users and tournaments...')

  await createUsers()
  await createTournaments()

  console.log('Seed complete.')
  await mongoose.disconnect()
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
