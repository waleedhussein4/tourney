// Central environment configuration.
//
// Everything the server reads from the environment is loaded, validated, and
// normalised here exactly once. Import this module instead of touching
// `process.env` directly, so a missing or malformed variable fails at boot with
// a readable message rather than as an undefined value deep inside a request.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const nodeEnv = process.env.NODE_ENV || 'development'

// dotenv never overwrites a variable that is already set, so the first file to
// define a key wins. Loading the environment-specific file first preserves the
// precedence the original project relied on, and real deployments (Vercel,
// Atlas) simply have no dotenv files at all.
dotenv.config({ path: path.join(serverRoot, `.env.${nodeEnv}`) })
dotenv.config({ path: path.join(serverRoot, '.env') })

// The names on the left are the ones the codebase uses; the aliases are what the
// original project used. Both are accepted so an existing local `.env` keeps
// working.
const ALIASES = {
  MONGODB_URI: 'DATABASE_URL',
  JWT_SECRET: 'SECRET',
  CLIENT_URL: 'FRONTEND_URL',
}

function read(name) {
  const value = process.env[name] ?? process.env[ALIASES[name]]
  const trimmed = typeof value === 'string' ? value.trim() : value
  return trimmed === '' ? undefined : trimmed
}

function describe(name) {
  const alias = ALIASES[name]
  return alias ? `${name} (or ${alias})` : name
}

function parsePort(raw) {
  if (raw === undefined) return 2000
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: `PORT must be an integer between 1 and 65535, got "${raw}"` }
  }
  return port
}

function loadConfig() {
  const problems = []

  const VALID_ENVS = ['development', 'production', 'test']
  if (!VALID_ENVS.includes(nodeEnv)) {
    problems.push(`NODE_ENV must be one of ${VALID_ENVS.join(', ')}, got "${nodeEnv}"`)
  }

  const mongodbUri = read('MONGODB_URI')
  if (!mongodbUri) {
    problems.push(`${describe('MONGODB_URI')} is required — the MongoDB connection string`)
  } else if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
    problems.push(`${describe('MONGODB_URI')} must start with mongodb:// or mongodb+srv://`)
  }

  const jwtSecret = read('JWT_SECRET')
  if (!jwtSecret) {
    problems.push(`${describe('JWT_SECRET')} is required — the secret used to sign auth tokens`)
  } else if (nodeEnv === 'production' && jwtSecret.length < 32) {
    problems.push(`${describe('JWT_SECRET')} must be at least 32 characters in production`)
  }

  const port = parsePort(read('PORT'))
  if (typeof port === 'object') problems.push(port.error)

  const clientUrl = read('CLIENT_URL')

  if (problems.length > 0) {
    throw new Error(
      [
        `Invalid server environment (NODE_ENV=${nodeEnv}):`,
        ...problems.map((problem) => `  - ${problem}`),
        '',
        'Copy server/.env.example to server/.env and fill in the missing values.',
        'See docs/SETUP.md for the five-command local setup.',
      ].join('\n')
    )
  }

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
    port,
    mongodbUri,
    jwtSecret,
    // Optional: unset means the client is served from the same origin as the
    // API, which is the target setup (Vite proxy locally, one Vercel project in
    // production) and needs no CORS at all.
    clientUrl,
  })
}

const config = loadConfig()

// Temporary bridge for the legacy modules still mounted while Phase 2 replaces
// them module by module: they read `process.env.SECRET` directly. Writing the
// validated value back under the legacy name means a `.env` using the new names
// keeps the old code working. Removed with the last legacy file.
process.env.SECRET = config.jwtSecret

export default config
