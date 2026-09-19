// One-off migration for paid publishing (docs/MONETISATION.md).
//
//   npm run migrate:publish-state
//
// Every tournament that existed before `publishState` did was, by definition,
// already public — so it becomes `published`, and nothing currently live
// disappears when the visibility rules start reading the field.
//
// Run it BEFORE deploying the code that reads `publishState`. It is idempotent:
// it only touches documents that have no `publishState` at all, so a second run
// matches nothing, and a draft created after the deploy is never promoted by it.

/* eslint-disable no-console -- this script's output is its user interface. */

import { fileURLToPath } from 'node:url'
import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import Tournament from '../src/models/tournament.model.js'

export async function migratePublishState() {
  // Through the driver rather than the model: mongoose would otherwise apply the
  // schema default to the filter's view of the world, and this is about what is
  // actually stored.
  const result = await Tournament.collection.updateMany(
    { publishState: { $exists: false } },
    { $set: { publishState: 'published' } }
  )
  return { migrated: result.modifiedCount }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await connectToDatabase()
    const { migrated } = await migratePublishState()
    console.log(`Marked ${migrated} existing tournaments as published.`)
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exitCode = 1
  } finally {
    await disconnectFromDatabase().catch(() => {})
  }
}
