// Seeds demo users and tournaments into the configured database.
// Usage: npm run seed  (from the repo root or the server workspace)
//
// Phase 3 of PLAN.md replaces this with a richer, idempotent seed.

const mongoose = require('mongoose')

let config
try {
  config = require('../src/config/env')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
const { createUsers } = require('./generateTestUsers')
const { createTournaments } = require('./generateTestTournaments')

async function seed() {
  await mongoose.connect(config.mongodbUri)
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
