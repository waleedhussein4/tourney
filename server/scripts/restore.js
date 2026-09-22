// Restores the users, tournaments and teams collections from a backup folder
// written by backup.js. Destroys whatever is currently live in those
// collections first, so it refuses to run without --yes.
//
//   npm run restore -- backups/2026-01-01_0000 --yes

/* eslint-disable no-console -- this script's output is its user interface. */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import User from '../src/models/user.model.js'
import Tournament from '../src/models/tournament.model.js'
import Team from '../src/models/team.model.js'

const MODELS = { users: User, tournaments: Tournament, teams: Team }

export async function restore(folder) {
  for (const [name, model] of Object.entries(MODELS)) {
    const raw = await fs.readFile(path.join(folder, `${name}.json`), 'utf8')
    const docs = JSON.parse(raw)
    await model.deleteMany({})
    if (docs.length > 0) await model.insertMany(docs)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const yes = args.includes('--yes')
  const folder = args.find((arg) => arg !== '--yes')

  if (!folder) {
    console.error('Usage: npm run restore -- <backup-folder> --yes')
    process.exitCode = 1
    return
  }

  if (!yes) {
    console.error(
      `Refusing to restore without --yes: this REPLACES every document in the ` +
        `users, tournaments and teams collections with the contents of ${folder}, ` +
        `permanently deleting whatever is currently live in those collections.\n` +
        `Re-run with --yes to proceed.`
    )
    process.exitCode = 1
    return
  }

  await connectToDatabase()
  await restore(folder)
  console.log(`Restored users, tournaments and teams from ${folder}`)
  await disconnectFromDatabase()
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  main().catch(async (error) => {
    console.error('Restore failed:', error.message)
    await disconnectFromDatabase().catch(() => {})
    process.exitCode = 1
  })
}
