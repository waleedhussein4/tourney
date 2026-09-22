// Worker entry point. Three jobs:
//
//   1. Forward every /api/* request to the container running the Express
//      app unchanged (see ../Dockerfile). `run_worker_first: ["/api/*"]` in
//      wrangler.jsonc is what routes those requests here instead of letting
//      asset routing try to serve them as static files first; everything
//      else falls straight through to Workers Static Assets, which is
//      configured via the `assets` binding and needs no code here.
//   2. Hand the Worker's secrets to the container. Container instances do
//      NOT inherit Worker bindings — `envVars` defaults to `{}` — so a
//      secret set with `wrangler secret put` is visible here but invisible
//      to the Express process unless it is forwarded explicitly. Without
//      this the container exits at boot on its own env validation and every
//      request fails with "the container is not running".
//   3. Trigger the daily demo reseed on the Cron Trigger: a GET to
//      /api/cron/reseed carrying the CRON_SECRET bearer token the route
//      already checks (server/src/modules/cron/cron.routes.js).
import { Container, getContainer } from '@cloudflare/containers'

// The names the Express app reads in server/src/config/env.js. Anything
// unset is omitted rather than passed as undefined, because the container
// runtime expects string values and the app treats absent-and-optional
// (SENTRY_DSN, PADDLE_*) differently from present-but-empty.
const FORWARDED = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CRON_SECRET',
  'CLIENT_URL',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET',
  'PADDLE_CLIENT_TOKEN',
  'PADDLE_PRICE_PLAN',
  'PADDLE_ENV',
  'SENTRY_DSN',
  'RESEND_API_KEY',
  'MAIL_FROM',
]

/** Must match the reseed entry in `wrangler.jsonc`'s `triggers.crons`. */
const DAILY_RESEED = '0 4 * * *'

export class TourneyContainer extends Container {
  defaultPort = 2000
  sleepAfter = '10m'

  constructor(ctx, env) {
    super(ctx, env)

    const forwarded = { NODE_ENV: 'production' }
    for (const name of FORWARDED) {
      const value = env[name]
      if (typeof value === 'string' && value !== '') forwarded[name] = value
    }
    this.envVars = forwarded
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const container = getContainer(env.TOURNEY_CONTAINER)
      return container.fetch(request)
    }

    return env.ASSETS.fetch(request)
  },

  // Two triggers, told apart by cron expression. `event.cron` is the literal
  // string from wrangler.jsonc, so this stays correct if the schedules move.
  //
  // The hourly sweep exists because the daily one cannot do its job: a match
  // reminder promising "starting within the hour" is meaningless if the only
  // chance to send it comes once a day at 04:00. The sweep is idempotent — the
  // notification table has a unique index on (user, type, subject) — so
  // running it every hour re-sends nothing, it only catches what has newly
  // come due.
  async scheduled(event, env) {
    const container = getContainer(env.TOURNEY_CONTAINER)
    const path = event.cron === DAILY_RESEED ? '/api/cron/reseed' : '/api/cron/notify-sweep'

    await container.fetch(`https://container${path}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    })
  },
}
