// Seeds a database with demo accounts, teams, credit packages, and tournaments
// in every state a visitor can land on.
//
//   npm run seed              # add whatever is missing
//   npm run seed -- --reset   # clear the demo data first
//
// No password is committed. SEED_DEMO_PASSWORD, SEED_ADMIN_PASSWORD, and
// SEED_PASSWORD set them; anything left unset is generated for that run and
// printed below, once.

/* eslint-disable no-console -- this script's output is its user interface. */

import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import { clearDemoData, seedCredentials, seedDemoData } from './seed-data.js'

function report(label, account) {
  const origin = account.fromEnv ? 'from the environment' : 'generated for this run'
  console.log(`  ${label.padEnd(9)}${account.email ?? '(every demo player)'}`)
  console.log(`  ${''.padEnd(9)}${account.password}   (${origin})`)
}

async function main() {
  await connectToDatabase()

  if (process.argv.includes('--reset')) {
    const cleared = await clearDemoData()
    console.log(
      `Cleared ${cleared.tournaments} tournaments, ${cleared.teams} teams, ` +
        `${cleared.users} users, ${cleared.transactions} ledger rows.`
    )
  }

  const result = await seedDemoData()
  const credentials = seedCredentials()

  console.log(
    `Seeded ${result.users} users, ${result.teams} teams, ` +
      `${result.products} credit packages, ${result.tournaments} tournaments.`
  )

  console.log('\nSign in with:\n')
  report('demo', credentials.demo)
  report('admin', credentials.admin)
  report('players', credentials.players)

  const anyGenerated = [credentials.demo, credentials.admin, credentials.players].some(
    (account) => !account.fromEnv
  )
  if (anyGenerated) {
    console.log(
      '\nGenerated passwords are shown only here. Set SEED_DEMO_PASSWORD,' +
        '\nSEED_ADMIN_PASSWORD and SEED_PASSWORD to choose your own.'
    )
  }

  await disconnectFromDatabase()
}

main().catch(async (error) => {
  console.error('Seed failed:', error.message)
  await disconnectFromDatabase().catch(() => {})
  process.exitCode = 1
})
