import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import User from '../src/models/user.model.js'
import { backup } from '../scripts/backup.js'
import { restore } from '../scripts/restore.js'
import { useDatabase } from './setup/database.js'

useDatabase()

describe('backup / restore', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tourney-backup-'))
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('round-trips users through a backup and restore', async () => {
    await User.create([
      { email: 'a@example.com', username: 'a', password: 'hashed' },
      { email: 'b@example.com', username: 'b', password: 'hashed' },
    ])

    const folder = await backup(tmpDir)
    await User.deleteMany({})
    expect(await User.countDocuments()).toBe(0)

    await restore(folder)
    expect(await User.countDocuments()).toBe(2)
  })
})
