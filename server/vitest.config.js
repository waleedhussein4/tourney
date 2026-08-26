import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // One in-memory MongoDB replica set is started for the whole run; each test
    // file then gets its own database inside it. A replica set rather than a
    // standalone `mongod` because every credit movement in this app runs in a
    // transaction, and a standalone server refuses those — the tests exercise
    // the same code path production does.
    globalSetup: ['./tests/setup/global-setup.js'],
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Starting the replica set and hashing bcrypt passwords are both slow enough
    // that the defaults are too tight on a cold CI runner.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    restoreMocks: true,
  },
})
