// Converts the old `matches` shape — a flat array of winner ids/`null`, one
// per bracket slot — into the match-subdocument shape the model now declares
// (`{ _id, round, slot, participants, scores, winner, state, ... }`).
//
//   npm run migrate:matches
//
// Idempotent: a tournament whose `matches[0]` already has a `round` field is
// left untouched, so running this twice is a no-op. Battle royale
// tournaments store `matches: []` either way and are untouched too.
//
// Uses the raw collection rather than the Mongoose model — the old documents
// no longer match the current schema, so hydrating them through Mongoose
// would drop or coerce the very data this script needs to read.

/* eslint-disable no-console -- this script's output is its user interface. */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v4 as uuidv4 } from 'uuid'
import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import Tournament, { buildBracketMatches } from '../src/models/tournament.model.js'

/** True once a document's `matches` are already subdocuments, not raw ids. */
function alreadyMigrated(matches) {
  return (
    matches.length === 0 ||
    (typeof matches[0] === 'object' && matches[0] !== null && 'round' in matches[0])
  )
}

/** The new match tree for one bracket document, winners and pairings carried over. */
function migrateDoc(doc) {
  const shells = buildBracketMatches(doc.maxCapacity).map((shell) => ({
    ...shell,
    _id: uuidv4(),
  }))

  const order = doc.bracketOrder ?? []
  for (const match of shells) {
    if (match.round !== 1) continue
    match.participants = [order[match.slot * 2] ?? null, order[match.slot * 2 + 1] ?? null]
  }

  const oldWinners = doc.matches
  shells.forEach((match, index) => {
    const winner = oldWinners[index] ?? null
    match.winner = winner
    match.state = winner ? 'final' : 'pending'
  })

  // Propagate each round's winner into the next round's participants, same as
  // `updateMatches` does going forward.
  for (const match of shells) {
    if (!match.winner) continue
    const next = shells.find(
      (entry) => entry.round === match.round + 1 && entry.slot === Math.floor(match.slot / 2)
    )
    if (next) next.participants[match.slot % 2] = match.winner
  }

  return shells
}

export async function migrateMatches() {
  const cursor = Tournament.collection.find(
    { type: 'brackets', matches: { $exists: true, $ne: [] } },
    { projection: { matches: 1, maxCapacity: 1, bracketOrder: 1 } }
  )

  let checked = 0
  let migrated = 0

  for await (const doc of cursor) {
    checked += 1
    if (alreadyMigrated(doc.matches)) continue

    const matches = migrateDoc(doc)
    await Tournament.collection.updateOne({ _id: doc._id }, { $set: { matches } })
    migrated += 1
  }

  return { checked, migrated }
}

async function main() {
  await connectToDatabase()
  const { checked, migrated } = await migrateMatches()
  console.log(`Checked ${checked} bracket tournaments, migrated ${migrated}.`)
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
