# Deployment

Tourney runs as **one Cloudflare Worker**: Workers Static Assets serves the
built React client, and a Cloudflare **Container** runs the Express API,
unchanged, in Docker. The database is a MongoDB Atlas **M0** cluster.

This replaced Vercel because the app now takes real $5/month subscription
payments — commercial use Vercel's Hobby tier forbids — and the owner already
pays for Cloudflare.

---

## Why a container, and not Workers directly

Rewriting the API onto the Workers runtime was considered and rejected:

1. **Mongoose 8 doesn't run on Workers.** Mongoose's TCP sockets need Node's
   `net` module in a form the Workers runtime doesn't provide;
   [mongoose#14613](https://github.com/Automattic/mongoose/issues/14613) is
   open, and MongoDB's own guidance calls the workarounds exactly that.
2. **The Paddle webhook needs the raw request body** for signature
   verification, mounted ahead of `express.json` in `server/src/app.js`. That
   ordering, and Express's body handling generally, is easiest to keep by not
   changing the runtime at all.

Cloudflare Containers runs the existing Express app in Docker with no source
changes. Workers Static Assets serves `client/dist` from the same Worker, so
the app stays same-origin — which is what keeps the `httpOnly`,
`SameSite=Lax` auth cookie working without CORS.

## Same-origin, still

`CLIENT_URL` stays **unset** in production, exactly as it was on Vercel: no
`cors()` allowlist, one origin, the auth cookie is first-party.

---

## What is deployed

```
Dockerfile        builds and runs the Express API in a container
.dockerignore      keeps node_modules, .git, client/dist, and .env out of the image
wrangler.jsonc     the Worker: container binding, static assets, cron triggers
worker/index.js    routes /api/* to the container; the scheduled reseed
client/dist/       the static build, served by Workers Static Assets
```

`wrangler.jsonc` routes `/api/*` to the Worker first (`run_worker_first`),
which forwards it to the container; every other path is handled by asset
routing, falling back to `index.html` for the SPA
(`not_found_handling: "single-page-application"`).

`server/src/app.js` and everything under `server/src/` is unchanged —
`ensureDatabase`, the cached `globalThis` connection, and every route still
work exactly as they did on Vercel, because the container runs the same
`node server/src/index.js` a local `npm start` would.

---

## First-time setup

### 1. MongoDB Atlas

Unchanged from before: an M0 cluster, a database user, `0.0.0.0/0` network
access (the container has no stable outbound IP either), and a connection
string:

```
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/tourney?retryWrites=true&w=majority
```

### 2. Cloudflare — owner task

Create an API token (Edit Cloudflare Workers, including Workers Containers
Write) and note the account ID, then store both as **GitHub Actions repository
secrets**:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

These are what `.github/workflows/deploy.yml` passes to `wrangler deploy` —
the deploy itself needs no local Cloudflare login. Containers requires the
Workers **Paid** plan; confirm the account is on it before the first deploy.

Set every runtime secret the Worker and container need with `wrangler secret
put` (each prompts for the value, so none of them land in shell history or in
GitHub) — this can be run from any machine with `wrangler login`, it is a
one-time step against the Cloudflare account and is unrelated to how deploys
happen afterward. `JWT_SECRET` in particular **must be at least 32
characters** with `NODE_ENV=production` (`server/src/config/env.js` refuses to
boot otherwise), so check the value before pasting it in if it was copied from
a local `.env` that predates that requirement:

```bash
npx wrangler login   # one-time, from any machine — not needed for CI deploys after this
wrangler secret put MONGODB_URI
wrangler secret put JWT_SECRET   # 32+ characters in production
wrangler secret put CRON_SECRET
wrangler secret put PADDLE_API_KEY
wrangler secret put PADDLE_WEBHOOK_SECRET
wrangler secret put PADDLE_CLIENT_TOKEN
wrangler secret put PADDLE_PRICE_PLAN
wrangler secret put SEED_DEMO_PASSWORD
wrangler secret put SEED_ADMIN_PASSWORD
wrangler secret put SEED_PASSWORD
wrangler secret put RESEND_API_KEY
wrangler secret put MAIL_FROM
```

`PADDLE_ENV` and `SENTRY_DSN` are optional; set them the same way if used.

Password-reset email is sent through Resend. `MAIL_FROM` must be an address on
a domain **verified in Resend**, or every send fails with a 403 — Resend
rejects the send at request time, it does not queue or bounce it later. The
verified sending domain is **walenehq.com** (`MAIL_FROM` is an address at that
domain); the Resend account is on the free tier, which allows only one sending
domain, so `tourneylb.com` cannot be added as a second one. This is unrelated
to the contact address shown on the site (`CONTACT_EMAIL` in
`server/src/config/plans.js`) — that address is display-only and is never
used as a `From` header.

Both secrets are forwarded from the Worker to the container via the
`FORWARDED` array in `worker/index.js` — a secret set with `wrangler secret
put` is invisible to the Express process otherwise, since `@cloudflare/containers`
does not pass Worker bindings through to `envVars` by default. Missing mail
config is not a boot failure: the server starts either way, and only
`POST /api/auth/forgot-password` answers 503 (`MAIL_UNAVAILABLE`) until both
secrets are set.

`VITE_SENTRY_DSN` is different: it is a **build-time** value baked into the
client bundle by Vite, not something the running Worker reads, so it cannot be
a `wrangler secret`. Set it instead as a GitHub Actions repository secret
named `VITE_SENTRY_DSN` — the deploy workflow's build step passes it through
as an environment variable. Left unset, the build still succeeds and client
Sentry init stays a no-op, by design.

### 3. Deploy

Deploys run in GitHub Actions (`.github/workflows/deploy.yml`), not on any
local machine — the workflow builds the container image and runs
`wrangler deploy` on `ubuntu-latest`, which has Docker available. It triggers
automatically on every push to `main`, and can be run by hand from a branch:

```bash
gh workflow run deploy.yml --ref <branch-or-sha>
```

Local Docker is **optional** — only needed if someone wants to build the
container image by hand (`docker build .`) or run `npm run deploy` from their
own machine. Neither is the normal path.

### 4. DNS — owner task

The domain (`tourneylb.com`, currently on Porkbun) must move to Cloudflare
nameservers (full setup, not just a CNAME):

1. Add the site to the Cloudflare dashboard and note the two nameservers it
   assigns.
2. Update the nameservers at Porkbun to those two.
3. Wait for Cloudflare to report the zone active.
4. Route both the apex `tourneylb.com` and `www` to the Worker (a Worker
   Route or a Custom Domain in the dashboard, once the zone is active).

None of this is a repository change, and DNS propagation is outside this
codebase's control.

---

## Environment variables / Worker secrets

| Name                                                                                  | Where                       | Required | Notes                                                                                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                                                                         | Worker secret, local server | **yes**  | Atlas connection string, including the `/tourney` database name. Alias: `DATABASE_URL`.                                                   |
| `JWT_SECRET`                                                                          | Worker secret, local server | **yes**  | Signs the auth cookie. At least 32 characters in production. Alias: `SECRET`.                                                             |
| `NODE_ENV`                                                                            | set in the container        | —        | `production` in the deployed image. Controls the cookie's `Secure` flag and request logging.                                              |
| `CLIENT_URL`                                                                          | —                           | no       | **Leave unset.** Setting it registers a `cors()` allowlist a same-origin deployment doesn't need. Alias: `FRONTEND_URL`.                  |
| `PORT`                                                                                | local only                  | no       | Defaults to `2000`, which is also what the container's `EXPOSE`/`defaultPort` use.                                                        |
| `CRON_SECRET`                                                                         | Worker secret               | no       | Bearer token the Cron Trigger presents to `/api/cron/reseed`. Unset means the route refuses to run at all. At least 16 characters.        |
| `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_CLIENT_TOKEN`, `PADDLE_PRICE_PLAN` | Worker secret               | no       | Card payments for the publishing fee. Unset, the app takes no cards.                                                                      |
| `PADDLE_ENV`                                                                          | Worker secret               | no       | `sandbox` (default) or `production`.                                                                                                      |
| `RESEND_API_KEY`                                                                      | Worker secret               | no       | Password-reset email. Unset means the server logs the email instead of sending it in dev/test, and 503s the reset endpoint in production. |
| `MAIL_FROM`                                                                           | Worker secret               | no       | Sender address for password-reset email. Must be on a domain verified in Resend (**walenehq.com**) or sends fail with 403.                |
| `SEED_DEMO_PASSWORD`, `SEED_ADMIN_PASSWORD`, `SEED_PASSWORD`                          | Worker secret, local        | no       | Demo account passwords. `SEED_ADMIN_PASSWORD` is not publishable.                                                                         |
| `SEED_DEMO_EMAIL`, `SEED_ADMIN_EMAIL`                                                 | Worker secret, local        | no       | Default to `demo@tourney.app` and `admin@tourney.app`.                                                                                    |
| `VITE_API_URL`                                                                        | client build                | no       | **Leave empty.** An empty value makes the client call a relative `/api`.                                                                  |
| `VITE_FRONTEND_URL`                                                                   | client build                | no       | Only used to build team invite links.                                                                                                     |
| `SENTRY_DSN`                                                                          | Worker secret               | no       | Optional server error tracking; unset, `Sentry.init` never runs.                                                                          |
| `VITE_SENTRY_DSN`                                                                     | GitHub Actions secret       | no       | Optional client error tracking. Build-time only — baked into the bundle by the deploy workflow, not a Worker secret.                      |

Set names only, never values, in this file or any committed file — every
secret above goes in as `wrangler secret put <NAME>`, which prompts
interactively.

---

## The scheduled reseed, and the notification sweep

Two Cloudflare Cron Triggers, both guarded by `CRON_SECRET` exactly as
documented in `server/src/modules/cron/cron.routes.js`:

```jsonc
// wrangler.jsonc
"triggers": { "crons": ["0 4 * * *", "0 * * * *"] }
```

The Worker's `scheduled` handler (`worker/index.js`) tells the two apart by
the cron string it's called with:

- **`0 4 * * *`** (daily, 04:00 UTC) calls the container at
  `/api/cron/reseed` with `Authorization: Bearer $CRON_SECRET` — clears and
  rebuilds the demo dataset.
- **`0 * * * *`** (hourly) calls `/api/cron/notify-sweep` with the same
  header — sends the "tournament starting within a day" and "match starting
  within an hour" reminders. It has to run hourly rather than daily because a
  one-hour reminder delivered by a once-a-day job isn't a one-hour reminder
  for most matches; see [ARCHITECTURE.md](ARCHITECTURE.md#notifications).

### Triggering one by hand

```bash
curl -s https://tourneylb.com/api/cron/reseed -H "Authorization: Bearer $CRON_SECRET"
curl -s https://tourneylb.com/api/cron/notify-sweep -H "Authorization: Bearer $CRON_SECRET"
```

---

## Seeding the production database

Unchanged — the seed script talks to Atlas directly and is not part of a
deployment:

```bash
cd server
MONGODB_URI='mongodb+srv://...' \
SEED_DEMO_PASSWORD='...' SEED_ADMIN_PASSWORD='...' SEED_PASSWORD='...' \
node scripts/seed.js -- --reset
```

An admin can also reseed from the live site, at `/admin`.

---

## Verifying a deployment

```bash
curl https://tourneylb.com/api/health        # {"status":"ok","database":"connected"}
curl https://tourneylb.com/api/tournaments   # the catalogue
curl -I https://tourneylb.com/assets/<file>  # a real file, not the SPA fallback
```

Then in a browser: sign in as the demo account, open a tournament, and
confirm the subscription checkout flow works end to end.

---

## Error tracking and health

**Errors.** `@sentry/node` (server) and `@sentry/react` (client) stay
inactive until `SENTRY_DSN` and `VITE_SENTRY_DSN` are set as above; no code
change needed to enable them.

**Health.** `GET /api/health` is public and returns `200` with
`{"status":"ok","database":"connected","emailConfigured":true,"paymentsEnabled":true}`
when the database is reachable, and a non-`200` when it is not. `status` and
`database` keep their exact shape — an uptime monitor may depend on them.
`emailConfigured` and `paymentsEnabled` are booleans only (no secrets, no
version numbers) so a misconfigured deploy — Resend or Paddle credentials
missing or half-set — is visible from a `curl`, not just from reading
container logs. It takes no arguments and touches no user data, so it is safe
to poll from whatever external monitor you prefer.

**Request ids and logging.** Every request gets an id — the inbound
`x-request-id` header if the caller sent one, otherwise a generated one — and
that id comes back on the response's `x-request-id` header, is attached to
the Sentry scope, and is included on the one structured JSON log line the
server writes per request (method, path, status, duration). So when a user
reports "it broke," ask for the `x-request-id` from their network tab (or
just the time) and grep container logs for it, or search Sentry for the
`request_id` tag. Log lines never include request bodies, cookies, tokens, or
email addresses.

## Reading container logs

**`wrangler tail` shows Worker logs only.** It does NOT show anything the
Container logs — not `console.log`/the structured request logs above, not an
uncaught exception, not a container crash. Assuming `wrangler tail` covers
the API cost about an hour once, chasing a "silent" failure that was sitting
in the Container's own logs the whole time.

To see what the Express app actually logged:

1. Cloudflare dashboard → Workers & Pages → the Worker → **Containers** tab →
   select the running container → **Logs** tab.
2. Each line is the JSON the logger wrote (`level`, `message`, `time`, and for
   request lines `requestId`, `method`, `path`, `status`, `durationMs`) — filter
   or search by any of those fields in the dashboard's log viewer.
3. For a crash specifically: a container that fails to boot or dies mid-request
   shows up here as its own log entry (or the container simply stops and
   restarts), not as a Worker error — `wrangler tail` stays quiet the entire
   time.

---

## Capacity and what it costs

The API runs in a Cloudflare Container. Two settings decide how it behaves
under load, and both cost money only while a container is actually running —
Cloudflare bills per running second, not per configured instance.

**`max_instances` in `wrangler.jsonc` (currently 5).** A ceiling, not a
reservation. At 1, every request in the world queued behind one process.
Measured against production before raising it:

|     | one request at a time | 50 concurrent |
| --- | --------------------- | ------------- |
| p50 | 463 ms                | 4,457 ms      |
| p95 | —                     | 6,542 ms      |

Nothing failed; it queued. Fifty people opening the browse page as a
tournament starts is a normal evening, so this was worth fixing.

**`sleepAfter` in `worker/index.js` (currently `10m`).** After ten idle
minutes the container stops, and the next visitor pays a cold start — measured
at **11.5 seconds**. Raising it trades running-hours for a faster first
request. It is deliberately left alone: the crowd problem was free to fix, this
one is not, and a quiet site paying to stay awake is the wrong default.

**Cost.** The `basic` instance (1 GiB memory, ¼ vCPU, 4 GB disk) costs roughly
**$0.028 per running hour**, and the Workers Paid plan includes about **25
running-hours a month**. A quiet month is very likely $0. Heavy use — awake
eight hours every day — lands near $5/month on top of the $5 plan. Watch it in
the Cloudflare dashboard under the container's Metrics tab before assuming.

---

## Backup and restore

Atlas M0 takes no automatic backups (see below), so a manual JSON dump is the
fallback. Both commands run against whatever `DATABASE_URL`/`MONGODB_URI`
points at — point it at production deliberately, not by accident.

```bash
npm run backup                         # dumps users, tournaments, teams to
                                        # backups/<timestamp>/*.json, prints the folder
npm run restore -- <backup-folder> --yes   # replaces those collections with the dump
```

`restore` refuses to run without `--yes`: it deletes every live document in
the users, tournaments and teams collections before writing the backup back
in. `backups/` is gitignored — a dump contains real user records, including
password hashes, and must never be committed.

## Known limitations

**Container cold starts.** A container that has scaled to zero takes longer
to answer its first request than a warm Worker invocation would. `sleepAfter`
in `worker/index.js` controls how long an idle container stays warm.

**Atlas M0.** 512 MB of storage, shared CPU, and a cap on concurrent
connections. The cached `globalThis` connection in `server/src/db/connect.js`
is what keeps the deployment inside that cap.

**`sanitize-html` is pinned to `>=2.13.0 <2.17.6`.** From 2.17.6 it depends on
an ESM-only `htmlparser2` which its own CommonJS entry point then `require()`s,
which crashes under Node's CommonJS loader. The pin holds it at the last
release whose parser still ships a CommonJS build. Worth revisiting once the
packaging is fixed upstream.

**SRV lookups can fail on a workstation.** `mongodb+srv://` needs a DNS SRV
query, and some local resolvers — VPN clients especially — refuse them
(`querySrv ECONNREFUSED`). That is a machine problem, not an application one.
Point the resolver at a public one, or seed using the non-SRV `mongodb://`
form of the connection string, which Atlas also provides.
