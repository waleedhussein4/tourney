// Seeds a database with demo accounts, credit packages, and tournaments.
//
//   npm run seed              # add whatever is missing
//   npm run seed -- --reset   # clear the demo data first
//
// No password is committed: set SEED_PASSWORD, or let the script generate one
// and print it once.

/* eslint-disable no-console -- this script's output is its user interface. */

import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import { clearDemoData, demoPassword, seedDemoData } from './seed-data.js'

async function main() {
  await connectToDatabase()

  if (process.argv.includes('--reset')) {
    const cleared = await clearDemoData()
    console.log(
      `Cleared ${cleared.tournaments} tournaments, ${cleared.teams} teams, ${cleared.users} users.`
    )
  }

  const result = await seedDemoData()

  console.log(
    `Seeded ${result.users} users, ${result.products} credit packages, ${result.tournaments} tournaments.`
  )
  console.log(`Demo account: ${result.demoEmail}`)
  console.log(`Password:     ${demoPassword()}`)
  if (!process.env.SEED_PASSWORD) {
    console.log('\nThat password was generated for this run. Set SEED_PASSWORD to choose your own.')
  }

  await disconnectFromDatabase()
}

main().catch(async (error) => {
  console.error('Seed failed:', error.message)
  await disconnectFromDatabase().catch(() => {})
  process.exitCode = 1
})
