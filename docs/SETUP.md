# Local setup

## Prerequisites

- **Node.js 20 or newer** (`node --version`) — the repo uses npm workspaces and
  `node --watch`.
- **MongoDB, as a replica set.** Every credit movement runs inside a MongoDB
  transaction, and transactions require a replica set. Two options:
  - A free [MongoDB Atlas M0](https://www.mongodb.com/cloud/atlas/register)
    cluster — already a replica set, nothing to configure. Recommended.
  - A local `mongod` started as a single-node replica set:
    ```bash
    mongod --replSet rs0 --dbpath /your/data/path
    mongosh --eval "rs.initiate()"     # once, the first time
    ```
    A plain `mongod` will serve every read and every non-financial write, but
    joining a tournament, buying credits, and paying out will fail with a clear
    "database does not support transactions" error.

## Five commands

```bash
git clone https://github.com/waleedhussein4/tourney.git && cd tourney
npm install
cp server/.env.example server/.env      # then set JWT_SECRET and MONGODB_URI
cp client/.env.example client/.env.local
npm run dev
```

The client runs on <http://localhost:5173> and the API on
<http://localhost:2000>. Vite proxies `/api` to the API, so the browser only
ever talks to one origin and there is no CORS to configure.

## Filling in `server/.env`

Both required variables are documented inline in `server/.env.example`. The
short version:

```bash
# a random signing secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `JWT_SECRET`. Leave `MONGODB_URI` at the local default, or
replace it with your Atlas connection string.

`server/src/config/env.js` validates all of this at boot. If something is
missing or malformed the server stops immediately and names the variable —
it will not start half-configured.

## Demo data

```bash
npm run seed
```

Creates the demo accounts, the credit packages, and one tournament of each
shape. The script prints the demo account and its password when it finishes.

No password is committed. Set `SEED_PASSWORD` in `server/.env` to choose one,
or let the script generate a fresh one for that run. `npm run seed -- --reset`
clears the demo data first.

> The credits checkout is a **demo**. Card fields are visual only and are never
> sent to the server. No real payment is ever processed.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the client together |
| `npm run dev -w server` | Runs just the API |
| `npm run dev -w client` | Runs just the client |
| `npm run lint` | Lints both workspaces |
| `npm run lint:fix` | Lints and applies safe fixes |
| `npm run format` | Formats with Prettier |
| `npm run build` | Production build of the client |
| `npm test` | Server test suite (vitest) |
| `npm test -w server -- --watch` | The suite, re-running on change |
| `npm run seed` | Seeds demo data |

## Tests

```bash
npm test
```

The suite runs against a real MongoDB: `mongodb-memory-server` starts an
in-memory **replica set** once per run, and each test file gets its own database
inside it. A replica set rather than a standalone `mongod`, because every credit
movement runs inside a transaction and a standalone server rejects those — so
the tests exercise the same code path production does.

Nothing needs to be installed or running first. The mongod binary is downloaded
and cached on first use.

## Troubleshooting

**`Invalid server environment (NODE_ENV=development)`** — the config module is
telling you exactly which variable is missing. Check `server/.env` against
`server/.env.example`.

**API requests 404 or go to the wrong host** — the client calls a relative
`/api` path and Vite proxies it. Check that `VITE_API_URL` in
`client/.env.local` is empty, and that the API is running on the port
`client/vite.config.js` targets.

**`MongooseServerSelectionError`** — nothing is listening on the configured
MongoDB address. Start your local `mongod`, or check that your Atlas cluster
allows your current IP.

**`EADDRINUSE :2000`** — something else holds the API port. Set `PORT` in
`server/.env`, and point the proxy at it with
`VITE_DEV_API_TARGET=http://localhost:<port>`.
