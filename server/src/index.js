// Local entrypoint: connect to MongoDB, then listen. Production is serverless
// and imports `app.js` instead, which is why nothing below lives in that file.

import config from './config/env.js'
import app from './app.js'
import { connectToDatabase } from './db/connect.js'

/* eslint-disable no-console -- this file is the process's console. */
async function main() {
  await connectToDatabase()
  console.log(`Connected to MongoDB (${config.nodeEnv})`)

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`)
  })
}

main().catch((error) => {
  console.error('Failed to start the server:')
  console.error(error.message)
  process.exitCode = 1
})
