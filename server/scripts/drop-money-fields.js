// Removes the entryFee/prize/prizes fields left over on tournament documents
// written before the money concept was dropped from the product (see
// docs/DECISIONS.md). The schema no longer declares them; this just clears
// the stray data out of MongoDB so old documents match the current shape.
//
//   npm run migrate:drop-money-fields
//
// Safe to run more than once — $unset on a field that is already gone is a
// no-op for that document.

/* eslint-disable no-console -- this script's output is its user interface. */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import Tournament from '../src/models/tournament.model.js'

export async function dropMoneyFields() {
  const result = await Tournament.collection.updateMany(
    {},
    { $unset: { entryFee: '', prize: '', prizes: '' } }
  )
  return { matched: result.matchedCount, modified: result.modifiedCount }
}

async function main() {
  await connectToDatabase()
  const { matched, modified } = await dropMoneyFields()
  console.log(`Checked ${matched} tournaments, cleared money fields on ${modified}.`)
  await disconnectFromDatabase()
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  main().catch(async (error) => {
    console.error('Migration failed:', error.message)
    await disconnectFromDatabase().catch(() => {})
    process.exitCode = 1
  })
}
