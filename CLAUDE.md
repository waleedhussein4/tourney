# CLAUDE.md — working rules for this repository

**Tourney** is a tournament hosting platform: players enter bracket or battle
royale tournaments with entry fees escrowed in demo credits; hosting a live
tournament beyond the first free one needs a $5/month subscription.

## Commands

```bash
npm install
npm run dev      # server + client concurrently
npm test         # server test suite (vitest)
npm run lint      # lint both workspaces
npm run build     # build the client
npm run seed      # seed demo data
npm run backup    # back up the database
```

## Hard rules

- **Never commit directly to `main`.** Feature branch → PR → CI green →
  squash-merge → delete branch.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `test:`,
  `refactor:`) for every commit and PR title.
- **No AI attribution lines** in commits or PRs, ever — a commit hook rejects
  them.
- **Every route input is validated with zod** (`params`, `query`, `body`)
  before the controller runs.

## Module anatomy

`server/src/modules/<name>/{<name>.routes.js, .controller.js, .schemas.js, .service.js}`

## More

See @docs/ARCHITECTURE.md and @CONTRIBUTING.md.
