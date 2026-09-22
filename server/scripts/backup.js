// Dumps the users, tournaments and teams collections to JSON files.
//
// Mongoose only — mongodump isn't installed here. Pair with restore.js.
//
//   npm run backup

/* eslint-disable no-console -- this script's output is its user interface. */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectToDatabase, disconnectFromDatabase } from '../src/db/connect.js'
import User from '../src/models/user.model.js'
import Tournament from '../src/models/tournament.model.js'
import Team from '../src/models/team.model.js'

const MODELS = { users: User, tournaments: Tournament, teams: Team }

function timestamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}`
  )
}

export async function backup(destRoot = path.join(process.cwd(), 'backups')) {
  const folder = path.join(destRoot, timestamp())
  await fs.mkdir(folder, { recursive: true })

  for (const [name, model] of Object.entries(MODELS)) {
    // `password` is `select: false` on User so a normal find leaves it out —
    // restoring that dump would then fail the model's required-password check.
    const query = model.find({})
    if (name === 'users') query.select('+password')
    const docs = await query.lean()
    await fs.writeFile(path.join(folder, `${name}.json`), JSON.stringify(docs, null, 2))
  }

  return folder
}

async function main() {
  await connectToDatabase()
  const folder = await backup()
  console.log(folder)
  await disconnectFromDatabase()
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  main().catch(async (error) => {
    console.error('Backup failed:', error.message)
    await disconnectFromDatabase().catch(() => {})
    process.exitCode = 1
  })
}
