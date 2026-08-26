# CLAUDE.md — working rules for this repository

**Tourney** is a tournament hosting platform: users buy credits (demo checkout),
pay 20 credits to become a host, and run **bracket** (single elimination) or
**battle royale** (score-ranked) tournaments, solo or team-based, open-join or
application-gated. Entry fees escrow into a per-tournament **bank** that must
cover advertised prizes before a tournament can start.

**PLAN.md is the source of truth.** Read the relevant phase in `PLAN.md` before
starting any work, and follow it. If the plan is ambiguous, choose the option
that reads best to a hiring manager and note the decision in the PR body.

---

## Repository layout

```
tourney/
  client/   React 18 + Vite SPA (plain JSX, no TypeScript)
  server/   Express + Mongoose API
  docs/     SETUP, API, ARCHITECTURE, DESIGN, DEPLOYMENT (added in later phases)
  .github/  CI workflow, PR/issue templates
```

This repo is the merge of the full histories of `tourney-frontend` (→ `client/`)
and `tourney-backend` (→ `server/`). ~694 commits and all six original
contributors are preserved. **Never squash away or orphan that history.**

## Stack is frozen

MongoDB + Mongoose, Express, React 18 + Vite, react-router-dom, **plain
JavaScript (JSX) — no TypeScript**. No Next.js, Nest, or Prisma. New libraries
within this stack are fine when a phase in PLAN.md allows them. Core features
are frozen too (Appendix A of PLAN.md): fix, restructure, and redesign freely;
never remove a core feature.

---

## Git workflow (mandatory from Phase 1 onward)

- **Never commit directly to `main`.** Every change: feature branch → PR → CI
  green → squash-merge → delete branch. `main` is protected.
- **Never force-push `main` or rewrite published history.** (The Phase 0
  migration was the one and only history rewrite.)
- **Branch names:** `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`,
  `test/<slug>`, `ci/<slug>`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`,
  `test:`, `refactor:`). Small, coherent commits within a branch.
- **PRs:** `gh pr create --fill` plus a hand-written body with
  **What / Why / How / Screenshots (if UI) / Checklist**, referencing the plan
  section (e.g. "Plan §4, PR 2 of 5").
- **Merging:** `gh pr checks --watch`, then
  `gh pr merge --squash --delete-branch`. The squash title must be a
  conventional commit line. Self-merge is expected; the human reviews
  asynchronously via the PR trail. If the human comments on an open PR, address
  the comments before merging.
- **Keep `main` deployable after every merge.** Never merge red. If a PR would
  break the app mid-phase, make the PR bigger or split it differently.

## Commands

```bash
npm install            # root install (npm workspaces)
npm run dev            # server + client concurrently
npm run build          # build the client
npm run lint           # lint both workspaces
npm test               # server test suite (vitest)
npm run seed           # seed demo data

npm run dev -w server  # single workspace
npm run dev -w client
```

## Code conventions

**Server**
- ESM throughout (`"type": "module"`).
- Every route input validated with **zod** (`params`, `query`, `body`) before
  the controller runs.
- One JSON error shape — `{ "error": { "message", "code?", "details?" } }` —
  emitted by a central `errorHandler`. Controllers `throw` an `ApiError`; an
  async wrapper removes try/catch noise.
- **Every multi-document credit movement runs in a mongoose transaction** and
  writes a `Transaction` document. Credits are conserved; the test suite proves
  it.
- No per-handler CORS blocks. Local dev proxies `/api` through Vite; production
  is same-origin on Vercel. At most one `cors()` allowlist registered once.
- Auth cookie: `httpOnly`, `sameSite: 'lax'`, `secure` in production,
  `path: '/'`, set exactly once via `res.cookie`.
- `helmet()`, rate limits on `/api/auth/*` and `/api/credits/*`, `morgan('dev')`
  in development only.

**Client**
- Server state through **React Query** (`useQuery`/`useMutation` +
  invalidation). **Zero `navigate(0)` calls.**
- **No direct DOM manipulation** in components: no `document.querySelector`, no
  `document.createElement`, no `prompt()` / `confirm()` / `alert()`. Modals and
  forms are React; every form uses `react-hook-form`.
- CSS Modules per component on top of `styles/tokens.css`.
- Every page has a loading state, an error state with retry, and an empty state
  with a call to action.
- Accessibility floor: semantic HTML, labeled inputs, focus-trapped modals with
  Escape, visible focus rings, alt text, WCAG-AA contrast.

**Both**
- No `console.log` in committed code (ESLint `no-console`).
- Delete dead code on sight — no commented-out blocks.
- Prefer boring, readable code. An interviewer will read this.

## Environment

Documented in `server/.env.example` and `client/.env.example` — keep both in
sync with the code. Server: `DATABASE_URL`/`MONGODB_URI`, `JWT_SECRET`/`SECRET`,
`PORT`, `NODE_ENV`, `CLIENT_URL`, seed variables. Client: `VITE_*` only —
never a secret, since these ship in the browser bundle.

## Honesty rules

- The checkout is a **demo**. Label it in the UI and the README. Card fields are
  visual only and are never sent to the server.
- No copyrighted game artwork, no Product Sans, no hotlinked third-party images.
  Original SVG/abstract art and properly licensed Google Fonts only.
- Costs stay at $0: Vercel Hobby + MongoDB Atlas M0.

## Asking the human

The human (waleedhussein4) prefers to be asked **only** when credentials,
external accounts, or irreversible actions are involved — Atlas connection
strings, `vercel login`, archiving or force-pushing the legacy repos, deleting
data. Everything else: decide, do it, and report.
