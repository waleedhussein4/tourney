// Worker entry point. Two jobs:
//
//   1. Forward every /api/* request to the container running the Express
//      app unchanged (see ../Dockerfile). `run_worker_first: ["/api/*"]` in
//      wrangler.jsonc is what routes those requests here instead of letting
//      asset routing try to serve them as static files first; everything
//      else falls straight through to Workers Static Assets, which is
//      configured via the `assets` binding and needs no code here.
//   2. Trigger the daily demo reseed on the Cron Trigger: a GET to
//      /api/cron/reseed carrying the CRON_SECRET bearer token the route
//      already checks (server/src/modules/cron/cron.routes.js).
import { Container, getContainer } from '@cloudflare/containers'

export class TourneyContainer extends Container {
  defaultPort = 2000
  sleepAfter = '10m'
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const container = getContainer(env.TOURNEY_CONTAINER)
      return container.fetch(request)
    }

    return env.ASSETS.fetch(request)
  },

  async scheduled(_event, env) {
    const container = getContainer(env.TOURNEY_CONTAINER)
    await container.fetch('https://container/api/cron/reseed', {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    })
  },
}
