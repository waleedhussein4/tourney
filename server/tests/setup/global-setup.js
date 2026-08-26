// Starts one in-memory MongoDB replica set for the whole test run.
//
// A replica set, not a standalone `mongod`: every credit movement runs inside a
// transaction, and a standalone server rejects those outright. Testing against a
// replica set means the suite exercises the same code path production does
// rather than a weakened version of it.
//
// The connection string reaches the test workers through `process.env`, which
// they inherit because Vitest forks them after this file has run.

import { MongoMemoryReplSet } from 'mongodb-memory-server'

/** @type {MongoMemoryReplSet | undefined} */
let replicaSet

export async function setup() {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  })

  process.env.NODE_ENV = 'test'
  process.env.TEST_MONGODB_URI = replicaSet.getUri()

  // `config/env.js` validates these at import time. Set them here so a
  // developer's own server/.env — or its absence — cannot change what the suite
  // runs against.
  process.env.MONGODB_URI = replicaSet.getUri()
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-be-realistic'
  process.env.CLIENT_URL = ''
  process.env.FRONTEND_URL = ''
  process.env.SEED_PASSWORD = ''
}

export async function teardown() {
  await replicaSet?.stop()
}
