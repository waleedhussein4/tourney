<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/brand/tourney-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="client/public/brand/tourney-logo-light.svg">
  <img alt="Tourney" src="client/public/brand/tourney-logo-dark.svg" width="260">
</picture>

### Run the tournament. Or win it.

Host and play grassroots tournaments — single-elimination brackets and
score-ranked battle royales, solo or in teams, open-join or application-gated.

[![CI](https://github.com/waleedhussein4/tourney/actions/workflows/ci.yml/badge.svg)](https://github.com/waleedhussein4/tourney/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/live-tourneylb.com-7c5cff)](https://tourneylb.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-3fb950)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933)
![React](https://img.shields.io/badge/react-18-61dafb)

**[→ Open the live demo](https://tourneylb.com)**

</div>

---

## Try it (60 seconds)

1. On the live demo, click **Use the demo account** (`demo@tourney.app` /
   `DemoPlayer2026`) instead of typing credentials.
2. Open **Your first tournament** from the profile menu.
3. Press **Publish**.

That's the whole loop — sign in, open a tournament you already host, put it
live. Everything else (brackets, teams, applications, standings) is reachable
from there.

Demo data resets daily at 04:00 UTC, so nothing you do sticks around — break
things freely.

---

## Screenshots

All below are from `docs/media/`; the same folder holds `docs/media/demo.gif`.

|                                                                    |                                                                       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| ![The home page](docs/media/home.png)                              | ![Browsing tournaments](docs/media/browse.png)                        |
| **Home** — the bracket motif, and the category cards               | **Browse** — filters live in the URL, so a filtered list is shareable |
| ![A tournament](docs/media/tournament.png)                         | ![Battle royale standings](docs/media/standings.png)                  |
| **A bracket** — who advanced, who went out                         | **A battle royale** — score-ranked, with a live leaderboard           |
| ![The host console](docs/media/manage.png)                         | ![The create wizard](docs/media/create.png)                           |
| **The host console** — everything a host can change, in one screen | **Creating one** — format, details, entry, review                     |

<div align="center">
  <img alt="Tourney on a phone" src="docs/media/mobile.png" width="300">
  <br><em>Responsive down to 360px.</em>
  <br><br>
  <img alt="A walkthrough of publishing a tournament" src="docs/media/demo.gif" width="480">
</div>

---

## What it does

- **Hosts and players.** Anyone can browse as a guest; signing in lets you
  enter tournaments and, once subscribed, host them.
- **Two formats.** Single-elimination brackets, and score-ranked battle
  royales with per-rank standings.
- **Solo or teams.** Create a team, invite by link or join code, promote a new
  leader. A team that has entered a tournament is frozen until it finishes.
- **Open-join or application-gated.** A host can let anyone in, or review and
  accept applications first.
- **Publishing and the subscription.** Your first live tournament is free.
  Running more than one at a time needs the Host plan — $5/month, unlimited
  live tournaments, cancel anytime.
- **Accounts.** Email verification on signup, self-serve password reset, and
  an account can be suspended by an admin if it's reported.
- **Match results.** Either competitor reports a score; the other confirms or
  disputes it. A dispute blocks that bracket from advancing until the host
  rules on it. Hosts can also schedule kickoff times per match.
- **Waitlists.** Joining a full tournament waitlists you instead of failing;
  a withdrawal promotes the next entry automatically.
- **Notifications.** In-app and email, with per-category preferences and a
  one-click unsubscribe link — application decisions, matches starting soon,
  results needing your confirmation, waitlist promotions.
- **Moderation.** Anyone can report a user or a tournament; admins can
  suspend accounts and unpublish or remove tournaments, and every action
  writes an audit row.
- **Host and player dashboards.** "What's next for you" (your next match,
  results awaiting confirmation, applications you're waiting on) and "what
  needs you" for hosts (open applications, disputes, reports) across
  everything they run.

---

## Run it locally

```bash
npm install
cp server/.env.example server/.env   # set MONGODB_URI to a connection string
npm run dev                          # npm run seed first to load demo data
```

Open <http://localhost:5173>. Full setup notes, including why a standalone
`mongod` won't work (the app relies on transactions), are in
[docs/SETUP.md](docs/SETUP.md).

---

## Architecture

```
Browser ──▶ React SPA (Vite) ──▶ /api/* via Vite dev proxy ──▶ Express ──▶ Mongoose ──▶ MongoDB Atlas
```

In production, client and server are served same-origin, so there's no CORS
configuration anywhere in the codebase and the auth cookie is first-party.
It's deployed on **Cloudflare**: one Worker serves the static SPA (Workers
Static Assets) and forwards `/api/*` to a Container running this same Express
app, with GitHub Actions deploying on every push to `main`. Two Cron Triggers
run against it — a daily reseed of the demo data and an hourly notification
sweep. Full details in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Module anatomy** — each server module is four files:
`*.routes.js` (zod validation) → `*.controller.js` (shapes the response) →
`*.service.js` (rules, transactions) → `*.schemas.js`. The client mirrors this
with one folder per feature: page + styles + queries.

- **Client state** is server state fetched through TanStack Query
  (`useQuery`/`useMutation` + cache invalidation) — no manual refetching, no
  full-page reloads.
- **Styling** is CSS Modules over a shared token sheet; see
  [docs/DESIGN.md](docs/DESIGN.md).
- **Tests** run against a real MongoDB replica set via
  `mongodb-memory-server`, not mocks.
- **CI** (`.github/workflows/ci.yml`) runs lint, the regression gates, the
  test suite, and a client build on every PR.

---

## Payments

Subscriptions run through **Paddle Billing**:

1. The server opens the transaction (`POST /api/billing/checkout`) —
   never the browser, so the plan and account are ours to trust.
2. The client hands that transaction to **Paddle.js**, which renders the
   card-entry overlay. Card details never touch our server.
3. Paddle calls back a webhook (`server/src/modules/subscriptions/webhook.routes.js`)
   mounted ahead of the JSON body parser, so the signature check runs over the
   **raw request body** — a re-serialised body would break it.
4. The handler applies the new status idempotently: each event carries an id,
   and a repeat delivery with an id already recorded is a no-op, so Paddle's
   retries can never double-apply a change.
5. An account's plan is one of `none`, `active`, `past_due`, or `canceled`.
   `past_due` still counts as active — a retrying card shouldn't take a
   host's tournaments offline.

To run it locally, put Paddle **sandbox** keys in `server/.env` and use a
sandbox test card; see [docs/SETUP.md](docs/SETUP.md) for the exact variables.

<div align="center">
  <img alt="The billing screen" src="docs/media/billing.png" width="480">
</div>

---

## Testing

`npm test` runs the server suite (**319 tests**, vitest + supertest, against
a real in-memory MongoDB replica set) and the client suite (**38 tests**,
vitest + Testing Library). Server coverage includes auth and password
reset/email verification, the publish/subscribe gate on tournament creation,
the full bracket and battle-royale lifecycle (including waitlists, disputes,
and match scheduling), team membership guards, notifications and their
idempotency, the subscription webhook (including replayed and out-of-order
events), moderation and reporting, the daily seed reset, and backup/restore.
Client coverage covers the auth forms, the billing and create-tournament
flows, the notification bell, and both dashboards.

---

## What I'd do next

- Arabic across the whole app, not just the marketing copy.
- Swiss and double-elimination formats alongside single-elimination and
  battle royale.
- Push notifications, not just in-app and email.
- Paginated, filterable admin views for reports and moderation history —
  today's `GET /api/admin/reports` is a flat list.

---

## Licence

MIT — see [LICENSE](LICENSE).
