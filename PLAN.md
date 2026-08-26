# TOURNEY — Full Rewrite Execution Plan

> **Audience:** Claude Code, running inside Cursor with git/gh/npm autonomy.
> **Author of record:** waleedhussein4 (the human). You act on his behalf.
> **Prime directive:** Rewrite the existing Tourney project into a polished portfolio
> piece **without changing the tech stack or the core concept**. Same app, same
> features, same MERN stack — dramatically better code, UI, docs, and repo.

---

## 0. Mission, constraints, and non-negotiables

### What Tourney is (must remain recognizable)

A tournament hosting platform. Users sign up, buy **credits** (mock checkout — no
real payments), pay 20 credits to become a **host**, and create tournaments in two
formats: **brackets** (single elimination, one winner prize) and **battle royale**
(score-ranked leaderboard, prize table by rank), each either **solo** or
**team-based**. Tournaments are **open** (join directly, entry fee deducted) or
**application required** (custom application form defined by the host; host
accepts/rejects). Entry fees flow into a per-tournament **bank** (escrow); the bank
must equal total advertised prizes before the host can start; hosts can top it up
from their own credits. Hosts start/end tournaments, shuffle brackets, record match
winners, edit scores/eliminations, and post updates. Teams are separate entities
with a 6-character join code, invite link, leader, kick/promote/leave/delete.
Guests can browse everything without an account. There's a trending carousel, a
"My Tournaments" section, search/filter/pagination, and a hidden admin page that
seeds/clears demo data.

### Hard constraints

1. **Stack is frozen:** MongoDB + Mongoose, Express, React 18 + Vite,
   react-router-dom, plain JavaScript (JSX). **No TypeScript.** No Next.js, no
   Nest, no Prisma, no framework swaps. New *libraries* within this stack are
   allowed (listed per phase below).
2. **Core features are frozen** (see Feature Parity Checklist, Appendix A). You may
   fix, complete, restructure, redesign, and rename internals — you may not remove
   a core feature or change the concept.
3. **Monorepo:** one repository named `tourney` containing `client/` and `server/`,
   created by **merging the full git histories** of `tourney-frontend` and
   `tourney-backend`. All ~690 historical commits and all original contributors
   must remain visible. Never squash away or orphan the old history.
4. **Git workflow:** after Phase 0 bootstrap, **never commit directly to `main`**.
   Every change: feature branch → PR → CI green → squash-merge → delete branch.
   Details in §1.
5. **Cost:** $0. Deployment on Vercel Hobby (client + serverless API) + MongoDB
   Atlas M0. No credit card, nothing that sleeps-and-deletes.
6. **Legal hygiene:** no copyrighted game artwork (no Fortnite/Valorant/etc. cover
   images), no Product Sans font, no hotlinked third-party images. Use original
   SVG/abstract art and properly licensed Google Fonts.
7. **Honesty:** the checkout is a demo. Label it as such in the UI and README.
   Never collect real card data (client-side only, clearly marked, never sent to
   the server).

### Working style

- Read this entire file before doing anything.
- Keep `main` deployable after every merge. If a PR would break the app mid-phase,
  make the PR bigger or split differently — never merge red.
- Prefer boring, readable code over clever code. An interviewer will read this.
- Delete dead code on sight. No commented-out blocks, no `console.log` in
  committed code (enforce via ESLint `no-console`).
- When this plan is ambiguous, choose the option that looks best to a hiring
  manager reading the repo, and note the decision in the PR description.

---

## 1. Git & GitHub workflow (applies from Phase 1 onward)

- **Branch names:** `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`,
  `test/<slug>`, `ci/<slug>`.
- **Commits:** Conventional Commits (`feat: …`, `fix: …`, `chore: …`, `docs: …`,
  `test: …`, `refactor: …`). Small, coherent commits within a branch.
- **PRs:** open with `gh pr create --fill` plus a hand-written body:
  *What / Why / How / Screenshots (if UI) / Checklist*. Reference the plan section
  (e.g. "Plan §4, PR 2 of 5").
- **Merging:** wait for CI to pass (`gh pr checks --watch`), then
  `gh pr merge --squash --delete-branch`. The squash title must be a conventional
  commit line. You self-merge; the human reviews asynchronously via the PR trail.
  If the human comments on an open PR, address the comments before merging.
- **Releases:** at the end (Phase 8), tag `v2.0.0` and publish a GitHub Release
  with structured notes (v1.0 = the original university project).
- **Never** force-push `main`, rewrite published history (after Phase 0), or
  delete the merged branch history.

You will encode all of this in `CLAUDE.md` at the repo root during Phase 0
(content spec in Appendix D) so every future session inherits the rules.

---

## 2. PHASE 0 — Monorepo migration & bootstrap

**Mode:** this phase only, you work directly on `main` (the repo doesn't exist
yet). Everything is done locally in the current working folder, then pushed.

### 2.1 Preconditions (verify, don't assume)

```bash
git --version && node --version && gh auth status
git filter-repo --version   # if missing, stop and tell the human to install it
```

Node must be ≥ 20. `gh auth status` must show an authenticated account
(waleedhussein4). If anything fails, stop and print exact install instructions
for the human.

### 2.2 Merge the two histories into one repo

Work inside the current folder. The two source repos:

- `https://github.com/waleedhussein4/tourney-backend.git` → becomes `server/`
- `https://github.com/waleedhussein4/tourney-frontend.git` → becomes `client/`

```bash
# Fresh clones (git-filter-repo requires fresh clones)
git clone https://github.com/waleedhussein4/tourney-backend.git _tb
git clone https://github.com/waleedhussein4/tourney-frontend.git _tf

# Rewrite backend history: everything moves under server/, and the leaked env
# files are excised from ALL history (secrets must not carry into the new repo).
cd _tb
git filter-repo --invert-paths --path .env --path .env.development
git filter-repo --force --to-subdirectory-filter server
cd ..

# Rewrite frontend history: everything moves under client/, and the unlicensed /
# redundant font archives are excised from ALL history.
cd _tf
git filter-repo --invert-paths \
  --path src/assets/fonts/Raleway.zip \
  --path src/assets/fonts/product-sans.zip \
  --path src/assets/fonts/product-sans
git filter-repo --force --to-subdirectory-filter client
cd ..

# Build the monorepo: base = rewritten backend history, then merge frontend.
git clone _tb tourney
cd tourney
git branch -m main 2>/dev/null || true
git remote remove origin
git remote add frontend ../_tf
git fetch frontend
git merge frontend/main --allow-unrelated-histories \
  -m "chore: merge tourney-frontend history into monorepo under client/"
git remote remove frontend
```

**Verify before proceeding (hard gate):**

```bash
git log --oneline | wc -l          # expect roughly 690+ commits
git shortlog -sn | head -20        # expect ~6 distinct authors
ls client server                    # both directories populated
git log --all --diff-filter=A -- '*.env*' | head   # server/.env* must NOT appear
```

If commit count or author list looks wrong, stop, do not push, report.

### 2.3 Bootstrap commits on `main` (still local)

Make these as separate conventional commits:

1. `chore: add root .gitignore` — ignore `node_modules`, `dist`, `.env`,
   `.env.*` (but not `.env.example`), `.vercel`, coverage, OS junk. Also fix
   `client/.gitignore` and `server/.gitignore` to include `.env*` properly.
2. `chore: remove committed env files from working tree` — delete
   `server/.env`, `server/.env.development`, `client/.env.development`,
   `client/.env.production` from the tree (history already cleaned for server).
   Add `server/.env.example` and `client/.env.example` placeholders (real content
   comes in Phase 1).
3. `docs: add CLAUDE.md` — content per Appendix D.
4. `docs: add PLAN.md` — copy this file into the repo root verbatim.

### 2.4 Create the GitHub repo, push, protect

```bash
gh repo create waleedhussein4/tourney --public \
  --description "Tournament hosting platform — brackets & battle royale, teams, credits economy. MERN monorepo." \
  --source=. --push

gh repo edit waleedhussein4/tourney \
  --add-topic mern --add-topic react --add-topic nodejs --add-topic express \
  --add-topic mongodb --add-topic vite --add-topic esports --add-topic tournament \
  --add-topic full-stack --enable-issues

# Branch protection: PRs required, CI required, no direct pushes to main.
cat > /tmp/protection.json <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["CI"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
gh api -X PUT "repos/waleedhussein4/tourney/branches/main/protection" \
  -H "Accept: application/vnd.github+json" --input /tmp/protection.json
```

Note: the `CI` required check will exist after Phase 1 PR 2. Until then PRs can
merge on the PR requirement alone; that's fine.

### 2.5 Report

Print: repo URL, total commit count, contributor list, confirmation that env
files are absent from history. Do **not** touch the old repos yet (that happens
in Phase 7).

**Phase 0 done.**

---

## 3. PHASE 1 — Foundation: workspaces, tooling, CI (3 PRs)

New dependencies allowed in this phase: `concurrently`, `prettier`,
`eslint` (+ react plugins already present), `dotenv` (server only).

### PR 1 — `chore/workspaces-and-scripts`

- Root `package.json` (private) with npm **workspaces** `["client", "server"]`
  and scripts:
  - `dev` → `concurrently -n server,client -c blue,green "npm:dev -w server" "npm:dev -w client"`
  - `build` → `npm run build -w client`
  - `lint`, `lint:fix`, `format`, `test`, `seed` → delegate to workspaces.
  - `engines: { "node": ">=20" }`.
- `server/package.json`: add the missing `scripts` block (`dev` with `node --watch`
  or nodemon, `start`, `test`, `seed`), set `"type": "module"` (the server will be
  rewritten as ESM in Phase 2 — for now keep it running: if flipping to ESM now
  breaks the legacy CJS files, keep CJS this PR and flip in Phase 2 instead;
  choose whichever keeps `main` green).
- Remove dead/wrong deps: `init`, `jsdom` (server — the strip-html use will be
  replaced), `dotenv` + `uuid` from **client** (never legitimately needed in the
  browser bundle), `mongodb` driver from server if `mongoose` suffices.
- `client/vite.config.js`: add dev **proxy** `/api → http://localhost:2000` so
  the client always calls a same-origin relative `/api` (this later kills CORS
  entirely).
- Verify `npm install && npm run dev` boots both apps (server may still be
  legacy-buggy; it just needs to boot).

### PR 2 — `ci/github-actions`

- `.github/workflows/ci.yml`, job name **`CI`** (must match branch protection):
  Node 20, `npm ci`, `npm run lint`, `npm test` (allowed to be a placeholder
  until Phase 3), `npm run build`. Trigger on `pull_request` and `push` to main.
- `.github/pull_request_template.md` (What/Why/How/Screenshots/Checklist).
- `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`.
- Badge-ready: workflow named so `README` can embed a status badge later.

### PR 3 — `chore/env-and-config`

- `server/src/config/env.js` (or CJS equivalent this phase): loads dotenv, reads
  and **validates** `MONGODB_URI`, `JWT_SECRET`, `PORT` (default 2000),
  `NODE_ENV`, `CLIENT_URL` (optional), failing fast with a clear message if
  required vars are missing. No more `.parsed.NODE_ENV` crash pattern.
- `server/.env.example` and `client/.env.example` with every variable documented
  in comments. Client: `VITE_API_URL=` (empty default = same-origin `/api`).
- `docs/SETUP.md`: local dev in five commands.

---

## 4. PHASE 2 — Server rewrite (5 PRs)

New dependencies allowed: `zod`, `helmet`, `express-rate-limit`, `cookie-parser`
(already present), `morgan` (dev logging), `sanitize-html` (already present).

**Target structure** (delete legacy files as each module is replaced — by the end
of this phase, `server/controller`, `server/middleware`, `server/models`,
`server/routes`, `server/scripts`, `server/index.js` (old) are gone):

```
server/
  src/
    app.js              # builds & exports the Express app (NO listen here)
    index.js            # local entrypoint: connect DB, app.listen
    config/env.js
    db/connect.js       # cached mongoose connection (serverless-safe)
    middleware/         # auth.js (requireAuth/optionalAuth/requireAdmin),
                        # validate.js (zod), errorHandler.js, notFound.js,
                        # rateLimits.js
    models/             # user.model.js, tournament.model.js, team.model.js,
                        # product.model.js, transaction.model.js
    modules/
      auth/    auth.routes.js  auth.controller.js  auth.service.js
      users/   ...
      teams/   ...
      tournaments/  tournament.routes.js  .controller.js  .service.js
                    bank.service.js  payout.service.js
      credits/ credits.routes.js  .controller.js  .service.js
      admin/   ...
    utils/
  scripts/seed.js       # replaces boot-time seeding entirely
  tests/                # Phase 3
```

**Global rules for the rewrite:**

- ESM throughout (`"type": "module"`).
- **Zero per-handler CORS header blocks.** Local dev uses the Vite proxy;
  production is same-origin on Vercel. If a `cors()` middleware is kept at all,
  it's a single allowlist (`CLIENT_URL`) registered once. Delete all 54 manual
  `Access-Control-*` blocks.
- One JSON error shape: `{ "error": { "message", "code?" , "details?" } }` via a
  central `errorHandler`. Controllers `throw` domain errors (small `ApiError`
  class); an async wrapper removes try/catch noise.
- Every route input validated with zod (`params`, `query`, `body`) before the
  controller runs.
- `helmet()`, `express-rate-limit` on `/api/auth/*` and `/api/credits/*`,
  `morgan('dev')` in development only.
- Auth cookie: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV==='production'`,
  `path: '/'`, set exactly once via `res.cookie` (no raw `Set-Cookie` headers).
  `requireAuth` sets `req.userId` (string) and must 401 if the user no longer
  exists.
- API path renamed `/api/tournement/*` → **`/api/tournaments/*`** (fix the typo);
  auth under `/api/auth/*`; a single `GET /api/users/me` returns
  `{ id, username, email, credits, isHost, isAdmin }` and replaces the old
  loggedin/isHost/isAdmin trio.
- **Mongo transactions** (mongoose sessions) around every multi-document credit
  movement: joining (debit user + credit bank + enroll), deposits, becoming host,
  purchases, payouts. Atlas M0 is a replica set; transactions work. Every credit
  movement also writes a `Transaction` document
  (`{ userId, type: 'purchase'|'entry_fee'|'bank_deposit'|'payout'|'host_upgrade'|'refund', amount, tournamentId?, createdAt }`).
- ID strategy: keep string-UUID `_id` for User/Tournament/Team (changing to
  ObjectId would be fine too, but UUIDs preserve continuity — **pick one and be
  consistent**; delete the redundant `Tournament.UUID` duplicate field and the
  weird `_id: { type: Object }` declarations, using
  `_id: { type: String, default: uuidv4 }` everywhere).
- Unify capacity semantics: `maxCapacity` = **number of participants slots**
  (players for solo, teams for team-based). Document it in the schema. All join /
  application / accept / bracket-slot math uses one definition.
- Unify team economics per the original README: team join costs
  `entryFee` **per member**, debited from the leader… **no** — implement the
  simpler, fairer documented rule: leader pays `entryFee × teamSize`, bank
  receives the same; payout splits equally among members. State this in docs.

### PR 1 — `refactor/server-skeleton`

`app.js`, `index.js`, config, db connect (with global connection cache for
serverless reuse), error handling, notFound, rate limits, helmet, morgan, zod
`validate` middleware, `ApiError`, async wrapper. Mount a temporary health route
`GET /api/health`. Legacy routes stay mounted until each module PR replaces them,
if that keeps main green; otherwise port minimally.

### PR 2 — `refactor/auth-and-users`

- `User` model rewritten: same fields; fix the swallow-and-return-undefined
  signup bug; proper duplicate-key handling; strong-password check kept;
  normalize email lowercase; never select `password` by default.
- Endpoints: `POST /api/auth/signup`, `POST /api/auth/login` (with `rememberMe`
  → 30d vs 1d token), `POST /api/auth/logout`, `GET /api/users/me`,
  `GET /api/users/me/transactions`.
- **Delete** `POST /api/user/removeEarn` (`subHostEarninhgs`) — the
  negative-number free-credit exploit. Its only legitimate purpose (funding
  payouts) is handled by the bank/payout services.
- **Delete** the fake `POST /api/user/payment` route.
- `becomeHost`: transaction — verify ≥20 credits, debit, set `isHost`, write
  `host_upgrade` Transaction. Price in a constants file, not magic number.

### PR 3 — `refactor/teams`

- Rewrite team module. Fix: membership checks that compared populated docs to
  strings; leader-only guards on kick/promote/delete verified server-side;
  `joinTeam` idempotence; consistent `{ error }` responses; `teamId` join code
  generated with collision retry.
- **Block destructive team ops while the team is enrolled in an active
  tournament** (kick/leave/delete) — closes the roster-mutation loophole.
- Remove the never-wired `checkMember` middleware or wire a correct version.

### PR 4 — `refactor/tournaments-core` and PR 5 — `refactor/tournaments-lifecycle`

Split however keeps PRs reviewable; between them they must deliver:

- **Create:** one code path (no four near-identical `Tournament.create` blocks).
  Zod discriminated union on `type` (`brackets` | `battle-royale`):
  brackets → `prize: number`; battle-royale → `prizes: [{rank, prize}]`.
  Normalize casing once. Validate `maxCapacity` (brackets: power of two),
  `teamSize ≥ 1`, dates from the form (**add start/end date-time inputs to the
  create flow** — the legacy code silently set both to "now", which is why
  start/end validation could never pass; this is a bug-fix, not a feature change).
- **Read:** `GET /api/tournaments` (paginated + filtered in **one** endpoint via
  query params; Mongo text index or regex — delete the O(N×full-scan)
  Jaro-Winkler-over-every-document search), `GET /api/tournaments/:id` (public
  display data; includes correct `isHost`, `isJoined`, `hasApplied`,
  `isAccepted` computed server-side — fixing the `app.user`-vs-`UUID` and
  missing-`isJoined` bugs), `GET /api/tournaments/:id/manage` (host-only),
  trending, categories, mine. Replace N+1 per-participant `User.findById` loops
  with a single `$in` query or aggregation.
- **Join/apply:** `joinSolo`, `joinTeam`, `apply`, `acceptApplication` (must
  check capacity), `rejectApplication`. All mutations **awaited** (no
  fire-and-forget `updateOne().then()`), all money moves in transactions,
  applications validated against the host's form definition.
- **Lifecycle:** `start` (bank-full check that actually works for both prize
  shapes; enough participants), `shuffleBrackets` (no persisting `null`
  placeholder members — store a `bracketOrder` instead), `updateMatches`
  (host-only, winners must be *enrolled in this tournament*, array length =
  slots−1), `end` + `payout.service.js`: brackets → winner gets prize (team:
  split equally among members, not leader-takes-all); battle-royale → prizes by
  rank over the sorted standings (correct lookups, `await`ed loops, in a
  transaction); leftover bank → host; `payout` Transactions written. Fix the
  dead-on-arrival `updateScores` (`ReferenceError`) by replacing it with
  `PATCH /api/tournaments/:id/participants` (host-only score/elimination
  updates for both solo and team shapes).
- **Bank:** `deposit` — host-only, validate **before** debiting (legacy debits
  then errors, destroying credits), cap at remaining need, transaction.
- **Delete/patch tournament:** either remove entirely or make host-only +
  authenticated with sane semantics (legacy versions were unauthenticated and
  broken). Recommended: keep `DELETE /api/tournaments/:id` host-only and only
  before start, with refunds of entry fees (transactions) — a nice completion.
- **Categories/images:** hardcoded hotlinked image map is deleted. Categories
  become a constants list; each gets a **local, original SVG card** (abstract —
  no game IP) generated in Phase 5.

### PR 5 (continued) — credits module

- `GET /api/products`, `GET /api/products/:id` (seed defaults if empty — move the
  seeding out of the GET handler into the seed script; the GET may lazily seed
  only in development).
- `POST /api/credits/checkout/:productId` — **demo** purchase: requires auth,
  rate-limited (e.g. 5/hour/user), grants credits in a transaction, writes a
  `purchase` Transaction, response explicitly `{ demo: true }`. Card data is
  never read from the body; the client never sends it.
- Fix/remove the dead `getProductById` (`res` out of scope).

---

## 5. PHASE 3 — Tests & seed (2 PRs)

New dev-deps: `vitest`, `supertest`, `mongodb-memory-server`.

### PR 1 — `test/server-foundation`

- Vitest config for `server/tests`; spin up `mongodb-memory-server` (replica-set
  mode so transactions work) per suite.
- Suites: auth (signup/login/logout/me, cookie flags, bad creds), credits (demo
  checkout grants + transaction row; **regression test proving negative-amount
  and repeat-purchase exploits are closed**), teams (create/join/kick/leader
  guards).
- Wire `npm test` into CI for real (remove placeholder).

### PR 2 — `test/tournament-lifecycle` + `feat/seed-script`

- Full happy-path integration: host creates → users join / teams apply →
  accepted → bank fills → deposit remainder → start → record matches / scores →
  end → assert every wallet and the bank net to zero (conservation of credits),
  payouts split correctly for team brackets and BR rank tables.
- Guard tests: non-host cannot start/end/postUpdate/deposit/edit; capacity
  enforced; can't join twice; host can't join own tournament.
- `server/scripts/seed.js`: idempotent; creates 12 demo users (**passwords from
  faker/random, printed once, not committed**), 4 teams, ~10 varied tournaments
  in different states (upcoming / filling / started / ended), one **demo
  account** `demo@tourney.app` with credits + host status (password via
  `SEED_DEMO_PASSWORD` env or generated+printed), one admin via
  `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` env. Boot-time auto-seeding is gone.

---

## 6. PHASE 4 — Client rewrite (4 PRs)

New dependencies allowed: `@tanstack/react-query`, `react-hot-toast` (or
equivalent tiny toast lib), keep `react-hook-form` (finally use it), keep
`react-brackets`, keep `react-quill`, keep `sanitize-html`. **Remove** `@mui/*`
and `@emotion/*` (used for one accordion — replace with a ~30-line accessible
accordion component), remove `cleave-zen` if a small formatter suffices.

**Target structure:**

```
client/src/
  api/            client.js (fetch wrapper: baseURL from VITE_API_URL or '/api',
                  credentials:'include', JSON errors normalized)
                  auth.js tournaments.js teams.js credits.js users.js
  app/            router.jsx, providers.jsx (QueryClient, AuthProvider, Toaster)
  components/     ui/ (Button, Input, Card, Modal, Accordion, Spinner, Badge,
                  EmptyState, ConfirmDialog…)  layout/ (Nav, Footer, PageShell)
  features/
    auth/         SignIn, SignUp, useAuth
    home/
    tournaments/  BrowsePage (filters+list+pagination), TournamentPage,
                  brackets/ (SoloBracket, TeamBracket), BattleRoyaleBoard,
                  JoinDialog, ApplyDialog
    host/         CreateTournamentPage (multi-step form)
    manage/       ManagePage + section components (Details, Participants,
                  Applications, Bank, Matches, Updates, DangerZone)
    teams/        TeamsPage, TeamPage, JoinByCode
    credits/      CreditsPage, CheckoutPage (demo-labeled)
    profile/      ProfilePage (username, email, credits, transaction history,
                  my tournaments) — completes the empty legacy page
    admin/        AdminPage
  styles/         tokens.css, globals.css  (Phase 5 owns the look)
```

**Global rules:**

- **Server state via React Query** (`useQuery`/`useMutation` + invalidation).
  This eliminates all 29 `navigate(0)` full-page reloads. Zero remaining
  `navigate(0)` calls is a Definition-of-Done item.
- **No direct DOM manipulation** in components: no `document.querySelector`, no
  `document.createElement` popups, no `prompt()`/`confirm()`/`alert()` — modals
  and forms are React (`react-hook-form` for every form). Zero remaining
  occurrences is a DoD item (grep-verifiable).
- `AuthProvider` calls `GET /api/users/me` once; exposes
  `{ user, isLoading, refresh, logout }`. Truthiness bugs (401 body treated as
  truthy `isHost`) die here. A `<ProtectedRoute>` (and `<HostRoute>`,
  `<AdminRoute>`) wrapper replaces per-page `useEffect` redirects, and preserves
  the "return to where you were after sign-in" behavior properly.
- **Remove the "remember password → plaintext localStorage" feature.**
  `rememberMe` only extends the server cookie lifetime.
- Checkout page: prominent "Demo mode — this is a portfolio project; no real
  payment is processed. Use any fake card number." Card fields are visual only,
  validated client-side for realism, **never included in the request body**.
- Fix client logic bugs while porting: filter changes must **reset** the list
  before appending pages; no `.sort()` mutation of props (copy first); bracket
  and BR components handle placeholder slots without persisted nulls; module-
  scope `navigate` crashes (team View, SoloBrackets) are structurally impossible
  in the new components; nested duplicate `AuthContextProvider` gone.
- Every page: loading skeleton, error state with retry, empty state with a
  call-to-action (per the writing guidance: errors say what happened and what to
  do; empty states invite action).
- Accessibility floor: semantic HTML, labeled inputs, keyboard-reachable modals
  with focus trap + Escape, visible focus rings, alt text.

**PR split:**

1. `refactor/client-foundation` — api layer, providers, router, auth, Nav,
   ProtectedRoute, SignIn/SignUp, Profile shell. Delete legacy context/hooks.
2. `refactor/client-tournaments` — Browse (filters in React state + URL
   searchParams, debounced search, pagination), Tournament page (join/apply
   dialogs, brackets/BR views, updates feed).
3. `refactor/client-host-manage` — Create Tournament rebuilt as a
   react-hook-form **multi-step wizard** (Type → Details → Format & prizes →
   Entry & capacity → Application form builder → Contact → Review), replacing
   the 44-useState monolith; Manage page rebuilt from section components with
   proper modals.
4. `refactor/client-teams-credits-admin-profile` — Teams flows, Credits +
   demo Checkout, Admin, Profile with transaction history.

---

## 7. PHASE 5 — Design system & visual overhaul (2 PRs)

Follow this design brief. The goal is a UI that looks deliberately designed for
*this* product, not a template.

**Subject & audience:** grassroots competitive gaming and sports tournaments;
players and small-community organizers. The interface's job: make competition
legible — who's in, what's at stake, who advances.

**Direction (binding):**

- **Dark-first** (competition-under-lights), but avoid the generic
  near-black + single-acid-accent AI look: build a layered dark neutral scale
  (distinct surface steps, not pure `#000`), one saturated primary accent drawn
  from the brand, and a disciplined semantic set (success/credits, danger/
  eliminated, warning/pending). Define everything as CSS custom properties in
  `styles/tokens.css` (color, spacing scale, radii, type scale, shadows,
  z-index). Document the system briefly in `docs/DESIGN.md` with rationale.
- **Typography:** choose a characterful display face for headings/numbers
  (candidates in the sporty/technical family: Space Grotesk, Archivo,
  Clash Display via Fontsource, Barlow Condensed) paired with a quiet body face
  (e.g. Inter or Instrument Sans). Self-host via `@fontsource/*` packages —
  no CDN `<link>`s, no Product Sans. Set a real type scale; let big tabular
  numbers (scores, credits, prize pools) be part of the personality.
- **Signature element:** the **bracket line** as a motif — the elimination-tree
  connector used sparingly as a graphic device (logo mark, section dividers,
  empty states, the 404). One motif, used with restraint; everything else stays
  quiet. Redraw the logo as a simple SVG wordmark + bracket glyph (light & dark
  variants — also used in the README).
- **Category art:** generate 13 original abstract SVG cards (one per category)
  from the token palette — geometric compositions, category name set in the
  display face. No game screenshots, no logos of real games.
- **Motion:** small and purposeful — hover states, dialog transitions,
  score-change tick. Respect `prefers-reduced-motion`.
- **CSS approach:** CSS Modules per component + the token sheet. Delete all 14
  legacy CSS files and the four ad-hoc Google-Font imports as pages are reskinned.
- **Quality floor:** responsive to 360px, visible keyboard focus, WCAG-AA
  contrast on text, Lighthouse ≥ 90 accessibility on Home/Browse/Tournament.

**PR split:** (1) `feat/design-tokens-and-ui-kit` — tokens, fonts, logo,
category art, core `ui/` components restyled, Nav/PageShell; (2)
`feat/visual-pass` — every page brought onto the system, screenshots after.

---

## 8. PHASE 6 — Deployment: Vercel + Atlas, $0, no sleep-and-delete (1 PR + human steps)

**Architecture:** one Vercel project serving the built client statically and the
Express app as a serverless function under `/api`. Same-origin in production →
no CORS, and the auth cookie is first-party (`SameSite=Lax`) so it works in
Safari too. Free Hobby tier: the deployment is permanent; serverless cold starts
(~1s) are the only cost of free, which is acceptable and honest.

### PR — `feat/vercel-deployment`

- `api/index.js` at repo root:
  ```js
  import app from '../server/src/app.js';
  export default app;        // @vercel/node runs the Express app per-request
  ```
  Ensure `server/src/db/connect.js` caches the mongoose connection on
  `globalThis` and `app.js` connects lazily (first request) — never on import,
  never `listen()`.
- Root `vercel.json`:
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "client/dist",
    "rewrites": [
      { "source": "/api/:path*", "destination": "/api/index" },
      { "source": "/:path*", "destination": "/index.html" }
    ]
  }
  ```
  (Adjust to whatever the current Vercel monorepo docs prescribe — verify with a
  real deploy, don't trust memory.)
- Delete the legacy `client/vercel.json`, `server/vercel.json`, and the DNS
  `dns.setServers` hack.
- `docs/DEPLOYMENT.md`: exact steps, env var table, seed instructions,
  known-limitations note (cold starts, Atlas M0 limits).

### Human-in-the-loop steps (you request these, the human clicks)

1. Human creates a **MongoDB Atlas** account → free M0 cluster → DB user →
   Network Access `0.0.0.0/0` (required for serverless) → gives you the
   connection string. You never paste it into any committed file.
2. Human runs `vercel login` once (you install the CLI and drive everything
   else: `vercel link`, `vercel env add MONGODB_URI/JWT_SECRET/NODE_ENV/
   SEED_*`, `vercel deploy --prod`).
3. You run the seed script against Atlas locally, verify the live site through
   every core flow, then `gh repo edit --homepage <live-url>`.

---

## 9. PHASE 7 — Presentation: README, docs, repo polish (2 PRs)

### PR 1 — `docs/readme-and-docs`

**README.md** (this is the single highest-leverage file — spend real effort):

1. Centered logo (light/dark via `<picture>`), one-line tagline, badge row
   (CI status, live demo link, license, Node/React versions).
2. **Live demo** link + demo account callout (`demo@tourney.app` / password in
   a "try it" box) + 3–5 screenshots or a short GIF (capture via a Playwright
   script against the local app at a clean viewport; store in `docs/media/`).
3. Feature list grouped by role (Player / Host / Teams / Economy) — concise,
   truthful.
4. **Architecture** section: a Mermaid diagram (client ↔ /api serverless ↔
   Atlas; auth cookie flow; bank/escrow flow), plus a short "how the credits
   economy stays consistent" paragraph (transactions, conservation invariant,
   tested).
5. Tech stack table, local setup (copy-paste block), test instructions,
   project structure tree.
6. **History & credits**: "Originally built as a 6-person university course
   project (v1.0); this repository merges both original repos with full commit
   history and continues as a solo rewrite (v2.0)." Credit the original team
   (GitHub handles from `git shortlog`). This framing is honest and reads well
   to employers.
7. Roadmap (notifications, withdrawals, friends — the honest not-yet list),
   License.

**Also:** `docs/API.md` (every endpoint: method, path, auth, body, response,
errors — generate from the route/zod definitions so it's accurate),
`docs/ARCHITECTURE.md` (decisions + trade-offs, including "why serverless
Express", "why UUID ids", "why demo payments"), `CONTRIBUTING.md`,
`LICENSE` (MIT, plus a `NOTICE`-style credits line for the original team —
flag to the human that teammate consent for the license is his call).

### PR 2 — `chore/repo-polish` + old-repo handover

- `gh repo edit`: final description, homepage = live URL, topics confirmed.
- Generate `docs/media/social-preview.png` (1280×640, logo + tagline on the
  token palette) — the human uploads it in Settings (API can't).
- **Old repos** (ask the human to confirm before executing): push a final
  commit to each legacy repo replacing the README with "➡️ This project moved
  to [waleedhussein4/tourney] with full history — this repo is archived.",
  then `gh repo archive` both.
- `git tag v1.0.0` on the last pre-rewrite commit (the Phase 0 merge base) for
  historical clarity.

---

## 10. PHASE 8 — Final QA & release (1 PR)

- Scripted walkthrough (Playwright, headed or headless) of the full loop on the
  **production** URL: signup → demo checkout → become host → create both
  tournament types (solo + team) → second account joins / team applies → accept →
  deposit to fill bank → start → record results → end → verify payouts and
  transaction history → teams join-by-code flow → guest browsing logged out.
- Fix everything found (this PR), re-run, Lighthouse spot-check.
- Verify Feature Parity Checklist (Appendix A) and the grep gates:
  `grep -rn "navigate(0)" client/src` → empty; `grep -rn "console.log" client/src server/src` → empty;
  `grep -rn "document.createElement\|prompt(\|alert(" client/src` → empty.
- `git tag v2.0.0`; `gh release create v2.0.0` with structured notes
  (Highlights / Security fixes / Full change summary / Credits).
- Final report to the human: live URL, repo URL, anything requiring his hands
  (social preview upload, pinning the repo, resume line suggestion).

---

## Appendix A — Feature Parity Checklist (all must work at the end)

- [ ] Signup / login / logout, cookie auth, remember-me duration
- [ ] Guest can browse home, tournament list, tournament details
- [ ] Buy credits via demo checkout (labeled), balance updates, transaction logged
- [ ] Become host for 20 credits
- [ ] Create tournament: brackets & battle royale × solo & team, custom
      application form builder, rules/description rich text (sanitized), contact
      info, entry fee, capacity, prizes (single / rank table), start & end dates
- [ ] Open join (solo + team) with entry fee → bank
- [ ] Application flow: apply with form → host views / accepts / rejects →
      accepted participant joins
- [ ] Teams: create, join by code & invite link, view, kick, transfer
      leadership, leave, delete
- [ ] Bank: fills from fees, host deposit, must be full to start
- [ ] Start tournament; shuffle brackets; record match winners (brackets);
      edit scores & eliminations (both formats)
- [ ] Post updates; updates visible on public page
- [ ] End tournament → correct payouts (brackets solo/team split, BR rank
      table), leftover → host, all as transactions
- [ ] Search / filters / pagination; trending carousel; My Tournaments
- [ ] Profile page: identity, credits, transaction history
- [ ] Admin page: seed / clear demo data (admin-gated)
- [ ] 404 page

## Appendix B — Bug & vulnerability ledger (every item must be provably dead)

Security: unlimited-credits purchase endpoint; negative-amount `removeEarn`
exploit; unauthenticated tournament DELETE/PATCH; missing host checks on
`postUpdate` and `depositIntoTournamentBank`; reflected-origin CORS with
credentials; contradictory double Set-Cookie; plaintext password in
localStorage; card data sent to server; secrets in git history (cleaned in
Phase 0; human rotates Atlas/JWT); seeded test users with committed passwords.

Crashes: `updateScores` ReferenceError; `getProductById` out-of-scope `res`;
team View `deleteTeam`/`leaveTeam` module-scope `navigate`; SoloBrackets
`handlePlayerClick` undefined `navigate`; dotenv `.parsed` crash; signup
undefined-user token crash.

Logic: `hasApplied` reads nonexistent field; `isJoined` never returned;
battle-royale bank check string-concatenates objects (start + deposit → BR can
never start); `endTournament` BR wrong lookups + unawaited async loops; deposit
debits before validating; fire-and-forget joins/applications (+ obsolete
`nModified`); manage-page dead `getUserByUsername(UUID)` block; three
inconsistent `maxCapacity` meanings; team fee ≠ documented rule; `editMatches`
doesn't verify enrollment; `acceptApplication` ignores capacity; filter change
appends instead of resetting pagination; 401 body treated as truthy
isHost/isAdmin; props mutated by `.sort()`; missing `body1.jpeg` background;
`.env.production` URL ≠ README URL; `/api/tournement` typo.

Hygiene: no server scripts block; `app.listen` + boot seeding on serverless;
54 duplicated CORS blocks; 170 console.logs; dead deps (`init`, `jsdom`,
client `dotenv`/`uuid`), dead code (`authReducer`, `checkMember`, module-level
sample tournament, unused Jaro-Winkler duplicate on the client); MUI for one
accordion; hotlinked category images; font zips + unlicensed Product Sans;
`.gitignore` not covering `.env`.

## Appendix C — Definition of Done (global)

CI green on main; all Appendix A boxes checked against production; all
Appendix B items verifiably gone; test suite covers auth, credits conservation,
and full tournament lifecycles; README renders beautifully on GitHub (check the
actual rendered page); live demo works logged-out and with the demo account;
zero secrets anywhere in the repo or its history; `npm install && npm run dev`
works first try on a clean clone.

## Appendix D — CLAUDE.md content (write this file in Phase 0)

Include, concisely: project one-liner; monorepo layout; the git workflow rules
from §1 verbatim (branches, conventional commits, PR body format, CI-then-
squash-merge, never touch main directly, never force-push); commands
(`npm run dev/lint/test/seed`, how to run one workspace); code conventions
(ESM server, no console.log, no direct DOM manipulation in React, zod on every
route, transactions for credit movements, error shape); env var list pointing
to `.env.example`; "PLAN.md is the source of truth — read the relevant phase
before starting work"; and a note that the human prefers being asked only when
credentials/accounts/irreversible actions are involved.
