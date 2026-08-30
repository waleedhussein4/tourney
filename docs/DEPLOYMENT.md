# Deployment

Tourney runs as **one Vercel project**: the built React client is served as
static files, and the Express API is a single serverless function mounted at
`/api`. The database is a MongoDB Atlas **M0** cluster.

Total cost: **$0**. Vercel Hobby and Atlas M0 are both permanently free, and
neither sleeps nor expires — the deployment stays up without a card on file.

---

## Why one project and not two

Two projects (client on one domain, API on another) would mean cross-origin
requests, which costs three things:

1. **CORS.** Every route would need an allowlist and a preflight round trip.
2. **The auth cookie.** It would become third-party. Safari's tracking
   prevention and Chrome's third-party cookie restrictions both block those, so
   sign-in would silently stop working for a share of visitors.
3. **A second origin.** The browser would resolve, connect, and negotiate TLS
   twice instead of once.

Same-origin removes all three. `CLIENT_URL` is therefore left **unset** in
production, which is what makes `server/src/app.js` skip registering `cors()`
at all, and the auth cookie is first-party with `HttpOnly; SameSite=Lax; Secure`.

## Region

The function is pinned to **`fra1` (Frankfurt)** in `vercel.json`, so that it
sits in the same region as the Atlas cluster (AWS `eu-central-1`). A single
request makes several database round trips; with the function and the database
on different continents each one costs roughly 100 ms, and the page waits for
all of them. Same-region makes them sub-millisecond.

If the Atlas cluster moves, change `regions` in `vercel.json` to match.

---

## What is deployed

```
vercel.json     build command, output directory, region, rewrites
api/index.js    exports the Express app; Vercel runs it per request
client/dist/    the static build, served straight from the CDN
```

`api/index.js` is one import and one export. An Express app _is_ a
`(req, res)` handler, which is exactly what a Vercel Node function is, so there
is no adapter and no second copy of the routing table.

Two rewrites do all the routing:

```json
{ "source": "/api/(.*)", "destination": "/api" }
{ "source": "/(.*)", "destination": "/index.html" }
```

Vercel checks the filesystem _before_ applying a rewrite, so real files
(`/assets/*`, `/favicon.svg`) are served directly and never reach the SPA
fallback. The function still receives the original path, so Express matches
`/api/auth/login` with its routers unchanged.

**Nothing connects to the database on import.** A serverless invocation has no
startup phase, so `app.js` connects lazily in an `ensureDatabase` middleware and
`db/connect.js` caches the connection promise on `globalThis`, which survives a
container thaw. Without that cache every invocation would open a new connection
and exhaust M0's connection limit within minutes.

`/api/health` is mounted _ahead_ of that middleware and connects best-effort, so
it can report `{"status":"degraded"}` when the database is unreachable rather
than failing along with it.

---

## First-time setup

### 1. MongoDB Atlas

1. Create a free account and an **M0** cluster, in the region you intend to pin
   the function to. This deployment uses AWS `eu-central-1` (Frankfurt).
2. **Database Access** — add a user with _Read and write to any database_.
   Prefer a generated password with no characters that need URL-escaping.
3. **Network Access** — add `0.0.0.0/0`. Serverless functions have no stable
   outbound IP, so an IP allowlist cannot work; access is controlled by the
   database credentials instead.
4. Copy the connection string and append the database name:

   ```
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/tourney?retryWrites=true&w=majority
   ```

The connection string is a secret. It belongs in `vercel env` and in your own
untracked `server/.env` — never in a committed file.

### 2. Vercel

```bash
npm i -g vercel
vercel login
vercel link           # creates or links the project, at the repository root
```

Then the environment. Each value is piped in on stdin, so none of them land in
shell history:

```bash
printf '%s' 'mongodb+srv://...'          | vercel env add MONGODB_URI production
printf '%s' "$(openssl rand -hex 32)"    | vercel env add JWT_SECRET production
printf '%s' 'DemoPlayer2026'             | vercel env add SEED_DEMO_PASSWORD production
printf '%s' '...'                        | vercel env add SEED_ADMIN_PASSWORD production
printf '%s' 'Player2026Demo'             | vercel env add SEED_PASSWORD production
```

Repeat with `preview` in place of `production` if preview deployments should
work too.

### 3. Deploy

```bash
vercel deploy --prod
```

Or merge to `main`: the project is connected to the GitHub repository and
deploys production on every push to it.

---

## Environment variables

| Name                                  | Where                | Required | Notes                                                                                                                          |
| ------------------------------------- | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `MONGODB_URI`                         | Vercel, local server | **yes**  | Atlas connection string, including the `/tourney` database name. Alias: `DATABASE_URL`.                                        |
| `JWT_SECRET`                          | Vercel, local server | **yes**  | Signs the auth cookie. At least 32 characters in production — the app refuses to boot otherwise. Alias: `SECRET`.              |
| `NODE_ENV`                            | set by Vercel        | —        | `production` on Vercel. Controls the cookie's `Secure` flag and request logging.                                               |
| `CLIENT_URL`                          | —                    | no       | **Leave unset.** Setting it registers a `cors()` allowlist that a same-origin deployment does not need. Alias: `FRONTEND_URL`. |
| `PORT`                                | local only           | no       | Defaults to `2000`. Meaningless on Vercel, which never calls `listen()`.                                                       |
| `SEED_DEMO_PASSWORD`                  | Vercel, local        | no       | Password for `demo@tourney.app`. Publishable: it is the account visitors are invited to use.                                   |
| `SEED_ADMIN_PASSWORD`                 | Vercel, local        | no       | Password for `admin@tourney.app`. **Not** publishable — that account can wipe and reseed the live demo data.                   |
| `SEED_PASSWORD`                       | Vercel, local        | no       | Shared by the seeded player accounts.                                                                                          |
| `SEED_DEMO_EMAIL`, `SEED_ADMIN_EMAIL` | Vercel, local        | no       | Default to `demo@tourney.app` and `admin@tourney.app`.                                                                         |
| `VITE_API_URL`                        | client build         | no       | **Leave empty.** An empty value makes the client call a relative `/api`, which is the point of the single-project setup.       |
| `VITE_FRONTEND_URL`                   | client build         | no       | Only used to build team invite links.                                                                                          |
| `CRON_SECRET`                         | Vercel               | no       | Bearer token for the scheduled reseed. Unset means the route refuses to run at all. At least 16 characters.                    |

The `SEED_*` passwords matter in production because the admin page can reseed
the live database. Left unset, the seeder generates a password per run and
prints it to a log nobody is reading — so the reseeded accounts would be
unreachable.

---

## Seeding the production database

The seed script talks to Atlas directly. It is not part of a deployment and
does not run on Vercel.

```bash
cd server
MONGODB_URI='mongodb+srv://...' \
SEED_DEMO_PASSWORD='...' SEED_ADMIN_PASSWORD='...' SEED_PASSWORD='...' \
node scripts/seed.js -- --reset
```

`--reset` clears the demo data first. Without it the script adds only what is
missing, and is safe to run twice.

The seeder goes through the same services the API does, so a seeded tournament
that says it has started really did pass the bank check, and a seeded payout
really did move credits and write ledger rows. That means it needs transactions
— which is why the test suite runs a replica set locally, and why Atlas (always
a replica set) works unchanged.

An admin can also reseed from the live site, at `/admin`.

---

## The scheduled reseed

The demo credentials are published in the README, so the demo account gets
spent down and the tournaments fill with strangers' test entries. The site
repairs itself once a day.

`GET /api/cron/reseed` runs the same clear-then-seed the CLI does, and
`vercel.json` schedules it:

```json
"crons": [{ "path": "/api/cron/reseed", "schedule": "0 4 * * *" }]
```

04:00 UTC, because Hobby cron granularity is one run per day and that is a
quiet hour. It is a `GET` because that is the only method Vercel Cron issues;
`POST` is accepted too, for triggering one by hand.

### Guarding it

This route empties the production database. It is the most dangerous endpoint
in the application and it is not protected by obscurity:

1. **Unset `CRON_SECRET` means it does not run.** Not "runs unauthenticated" —
   `503 CRON_NOT_CONFIGURED`, before touching anything. A development machine or
   a preview deployment that never configured the variable cannot be talked into
   wiping a database.
2. **The secret is required as a bearer token**, compared in constant time after
   hashing both sides so neither the value nor its length leaks through timing.
   Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once the
   variable exists on the project.
3. **It is rate limited** to ten requests an hour, so the token cannot be probed
   for.

`server/tests/cron.test.js` covers every one of those branches, including that a
request without the token changes nothing.

Set the secret like the others:

```bash
printf '%s' "$(openssl rand -hex 32)" | vercel env add CRON_SECRET production
```

### Triggering one by hand

```bash
curl -s https://<domain>/api/cron/reseed -H "Authorization: Bearer $CRON_SECRET"
```

```json
{
  "ok": true,
  "cleared": { "tournaments": 10, "teams": 4, "users": 13, "transactions": 35 },
  "seeded": { "users": 14, "teams": 4, "products": 0, "tournaments": 10 },
  "durationMs": 4008
}
```

`products` is `0` on a rebuild because the credit packages are catalogue rows
rather than demo data: the reset leaves them in place.

### The timeout, measured

A reseed creates fourteen accounts — each one a bcrypt hash at cost 10 — and
then drives ten tournaments through the real services, several of them inside
transactions. That is enough work to be worth measuring against the function's
deadline rather than assuming.

Measured on the deployed function, in `fra1`, against the Atlas cluster:

|                                |           |
| ------------------------------ | --------- |
| Reseed work, cold invocation   | **4.0 s** |
| Reseed work, warm invocation   | **4.0 s** |
| `maxDuration` in `vercel.json` | **60 s**  |

A fifteen-fold margin, so nothing here needs weakening — in particular the
seeded accounts are hashed at the same cost 10 as a real signup. The `fra1`
pinning is doing most of the work: the same script from a laptop outside the
region takes noticeably longer, because it pays the round trip on every one of
those writes.

`maxDuration` was raised from 15 s to 60 s (the Hobby ceiling) anyway, so that
the margin is the deadline's and not a guess. If the demo dataset ever grows
enough to threaten it, the fix in order of preference is: batch the account
creation, then lower the bcrypt cost **for seeded demo accounts only** — never
for `registerUser`'s real path.

If a run were ever cut off between the clear and the seed, the database would be
left empty rather than corrupt, and the next daily run rebuilds it — `seedDemoData`
is additive and idempotent. An admin can also reseed immediately from `/admin`.

---

## Verifying a deployment

```bash
curl https://<domain>/api/health        # {"status":"ok","database":"connected"}
curl https://<domain>/api/tournaments   # the catalogue
curl -I https://<domain>/assets/<file>  # a real file, not the SPA fallback
```

Then in a browser: sign in as the demo account, open a tournament, run the demo
checkout, and confirm the credit balance in the nav changes without a reload.

---

## Known limitations

**Cold starts.** A Hobby function that has not been called recently takes about
a second to answer its first request; everything after that is warm. That is
the honest cost of a free, permanently available deployment, and it is
preferred here to a host that sleeps the whole application after fifteen
minutes — or deletes the database after a trial.

**Atlas M0.** 512 MB of storage, shared CPU, and a cap on concurrent
connections. The cached `globalThis` connection is what keeps a serverless
deployment inside that cap. M0 has no backups either; the data here is demo
data and is reproducible with `npm run seed`.

**`sanitize-html` is pinned to `>=2.13.0 <2.17.6`.** From 2.17.6 it depends on
an ESM-only `htmlparser2` which its own CommonJS entry point then `require()`s.
Node 22+ tolerates that locally, Vercel's module loader does not, and the
function crashes on every invocation with `ERR_REQUIRE_ESM`. The pin holds it at
the last release whose parser still ships a CommonJS build. Worth revisiting
once the packaging is fixed upstream.

**SRV lookups can fail on a workstation.** `mongodb+srv://` needs a DNS SRV
query, and some local resolvers — VPN clients especially — refuse them
(`querySrv ECONNREFUSED`). That is a machine problem, not an application one,
and it is why this codebase does **not** carry the `dns.setServers` call the
original had: a web server should not be overriding its host's DNS. Point the
resolver at a public one, or seed using the non-SRV `mongodb://` form of the
connection string, which Atlas also provides.
