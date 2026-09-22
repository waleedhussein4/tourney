# Contributing

Thanks for looking. This is a portfolio project, so the bar it holds itself to
is "a reviewer can read it" — that is what the conventions below are for.

Issues and pull requests are welcome. Opening an issue first is best for
anything large enough that the design should be argued about before the code
is written.

## Getting set up

```bash
npm install
cp server/.env.example server/.env    # set MONGODB_URI and JWT_SECRET
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for the database and demo-data details.

## Before opening a PR

```bash
npm run lint && npm test
```

CI also runs `npm run check:regressions` (grep tripwires for old bugs) and
`npm run build`. If your four commands pass locally, CI passes too.

## Workflow

- **Never commit to `main`.** Branch, open a pull request, get CI green,
  squash-merge, delete the branch.
- **Branch names:** `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `ci/`,
  `refactor/` + a slug.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org).
  Small and coherent within a branch; the squash title is what lands on
  `main`.
- **No AI attribution trailers** (`Co-Authored-By: Claude`, "Generated with…",
  etc.) in commits or PRs — a commit-msg hook and a CI gate both reject them,
  whatever tool you used to help write the change.
- **Pull requests** use [the template](.github/PULL_REQUEST_TEMPLATE.md):
  What / Why / How, screenshots for anything visual, and the checklist.
- **`main` stays deployable after every merge.** It is live at
  https://tourneylb.com, so a red `main` is a broken production site the
  moment it deploys. If a change would break the app halfway through, make
  the PR bigger rather than splitting it somewhere that doesn't work.

## Code conventions

The full list is in [CLAUDE.md](CLAUDE.md) — zod at the edge, one error
shape, React Query with zero `navigate(0)`, CSS Modules on `tokens.css`, no
`console.log`, no dead code left commented out. Read it before your first PR.

## Out of scope

TypeScript, the app moving or holding money, and a different
framework/ORM/CSS approach. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
and [docs/DECISIONS.md](docs/DECISIONS.md) for why.
