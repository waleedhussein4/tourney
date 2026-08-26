// Mongoose connection helper.
//
// Serverless platforms freeze and thaw the same process, so opening a new
// connection per invocation exhausts the Atlas connection pool within minutes.
// The connection promise is cached on `globalThis` — which survives a thaw — and
// every caller awaits the same promise.

import mongoose from 'mongoose'
import config from '../config/env.js'

const CACHE_KEY = Symbol.for('tourney.mongoose')

function cache() {
  if (!globalThis[CACHE_KEY]) {
    globalThis[CACHE_KEY] = { connection: null, promise: null }
  }
  return globalThis[CACHE_KEY]
}

/**
 * Connects to MongoDB, reusing an existing connection when there is one.
 *
 * @param {string} [uri] Overrides the configured URI (used by the test suite).
 * @returns {Promise<import('mongoose').Mongoose>}
 */
export async function connectToDatabase(uri = config.mongodbUri) {
  const cached = cache()
  if (cached.connection) return cached.connection

  if (!cached.promise) {
    // Buffering hides connection failures behind request timeouts; failing fast
    // surfaces them at boot instead.
    mongoose.set('strictQuery', true)
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10_000 })
      .catch((error) => {
        // Drop the rejected promise so the next call can retry.
        cached.promise = null
        throw error
      })
  }

  cached.connection = await cached.promise
  return cached.connection
}

/** Closes the connection and clears the cache. Used by tests and scripts. */
export async function disconnectFromDatabase() {
  const cached = cache()
  cached.connection = null
  cached.promise = null
  await mongoose.disconnect()
}
