# Contributing

Thanks for looking. This is a portfolio project, so the bar it holds itself to
is "a reviewer can read it" — that is what most of the conventions below are
for.

Issues and pull requests are welcome. If you are planning something large, open
an issue first so the design can be argued about before the code is written.

---

## Getting set up

```bash
npm install
cp server/.env.example server/.env    # set MONGODB_URI and JWT_SECRET
npm run seed
npm run dev
```

You need a MongoDB connection string. The credit tests and the seed use
transactions, which a standalone `mongod` rejects, so use a free Atlas M0
cluster or a single-node replica set locally. [docs/SETUP.md](docs/SETUP.md) has
the details.

## Before you push

```bash
npm run lint              # both workspaces, zero warnings allowed
npm run check:regressions # the grep tripwires
npm test                  # the server suite
npm run build             # the client build
```

CI runs exactly those four, in that order, so if they pass locally they pass
there. `npm run format` (prettier) is not in CI, but keep the diff clean.

---

## Workflow

- **Never commit to `main`.** Branch, open a pull request, get CI green,
  squash-merge, delete the branch.
- **Branch names:** `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `ci/`,
  `refactor/` + a slug.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org).
  Small and coherent within a branch; the squash title is what lands on `main`.
- **Pull request bodies:** What / Why / How, screenshots for anything visual,
  and the checklist. "Why" is the part reviewers actually need.
- **`main` stays deployable after every merge.** It is connected to Vercel and
  deploys production on merge, so a red `main` is a broken live site. If a
  change would break the app halfway, make the PR bigger rather than splitting
  it somewhere that does not work.

---

## Code conventions

### Server

- ESM throughout. No CommonJS, no `require`.
- Every `params`, `query`, and `body` validated with **zod** in the route,
  before the controller runs.
- One error shape — `{ error: { message, code?, details? } }` — produced by the
  central `errorHandler`. Controllers `throw new ApiError(...)`; `asyncHandler`
  removes the try/catch.
- **Every multi-document credit movement runs inside a mongoose transaction and
  writes a `Transaction` row.** Credits are conserved, and
  `tests/conservation.test.js` proves it. A change that moves credits without a
  ledger row will fail the suite.
- Rules live in the service, not the controller and not the route.
- No `process.env` outside `config/env.js` — there is a gate for it.

### Client

- Server state through **React Query**. Mutations invalidate; nothing reloads
  the page. There is a gate against `navigate(0)` and `window.location.reload`.
- **No direct DOM manipulation** in components: no `document.querySelector`, no
  `document.createElement`, no `prompt` / `confirm` / `alert`. Dialogs and forms
  are React; every form uses `react-hook-form`.
- CSS Modules beside the component, on top of `styles/tokens.css`. Use the
  semantic tokens (`--surface-raised`), not the primitives (`--ink-850`).
- Every page has a loading state, an error state with a retry, and an empty
  state with something to do about it.
- Accessibility floor: semantic HTML, labelled inputs, focus-trapped dialogs
  that close on Escape, visible focus rings, alt text, WCAG-AA contrast.
  [docs/DESIGN.md](docs/DESIGN.md) has the palette's measured contrast ratios.

### Both

- No `console.log` in committed code — ESLint `no-console`, plus a gate.
- Delete dead code rather than commenting it out.
- Prefer boring and readable. Comments should explain _why_, especially where
  the obvious approach was rejected for a reason.

---

## Tests

Add a test with behaviour. The suites are organised by what they defend rather
than by file, so put a new case with the guarantee it belongs to:

|                            |                                                            |
| -------------------------- | ---------------------------------------------------------- |
| `auth`, `teams`, `credits` | everyday paths and their failure modes                     |
| `tournaments.guards`       | who may do what, and what the state forbids                |
| `tournaments.lifecycle`    | create → join → bank → start → results → payout            |
| `conservation`             | credits are conserved and the ledger reconstructs balances |
| `seed`                     | the demo data builds, is idempotent, commits no passwords  |
| `cron`                     | the reseed's lock                                          |

Tests run against a real in-memory MongoDB replica set. Each file gets its own
database, so they run in parallel and do not interfere.

### The regression gates

`scripts/check-regressions.sh` is one grep per bug the rewrite fixed — no
hotlinked images, no password in `localStorage`, no card field sent to the
server, no secret in git history, and so on. They are deliberately crude: a
grep cannot be argued with, and it fails the build the moment a fixed bug comes
back. If you fix a bug that could plausibly return, add a gate for it.

---

## What is deliberately out of scope

Please do not open PRs for these; the reasoning is in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):

- **TypeScript.** The stack is frozen as plain JSX.
- **Real payments.** The checkout is a demonstration and is labelled as one.
- **A different framework, ORM, or CSS approach.** Next.js, Prisma, Tailwind
  and friends are all fine tools and all off the table here.
