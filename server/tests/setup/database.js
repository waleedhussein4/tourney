// Per-file database isolation.
//
// Test files run in parallel workers, so each one connects to its own database
// inside the shared replica set. Collections are emptied between tests, and the
// database is dropped when the file finishes.

import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { connectToDatabase, disconnectFromDatabase } from '../../src/db/connect.js'

function uriForThisFile() {
  const base = process.env.TEST_MONGODB_URI
  if (!base) {
    throw new Error('TEST_MONGODB_URI is not set — tests/setup/global-setup.js should have set it')
  }
  const url = new URL(base)
  url.pathname = `/tourney-test-${crypto.randomUUID()}`
  return url.toString()
}

/**
 * Call once at the top of a test file. Registers the connect / clean / drop
 * hooks so individual tests never have to think about database state.
 */
export function useDatabase() {
  beforeAll(async () => {
    await connectToDatabase(uriForThisFile())
  })

  afterEach(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await disconnectFromDatabase()
  })
}

/** Empties every collection without dropping indexes, which is much faster. */
export async function clearDatabase() {
  const collections = Object.values(mongoose.connection.collections)
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
}
