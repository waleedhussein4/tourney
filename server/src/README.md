# `server/src`

The API. Nothing outside `src/` runs in production except `scripts/`.

```
app.js            builds and exports the Express app — no listen, no connect
index.js          the local entrypoint: connect, then listen
config/           env.js (validated once), constants.js, products.js
db/               connect.js (cached for serverless), withTransaction.js
middleware/       auth, validate (zod), errorHandler, notFound, rateLimits
models/           user, team, tournament, transaction, product
modules/
  auth/           signup, login, logout
  users/          me, my transactions, become host
  teams/          create, join by code, roster changes
  tournaments/    create, browse, join, apply, bank, lifecycle, payouts
  credits/        the demo checkout and its catalogue
  admin/          seed and clear demo data
  health/         GET /api/health
utils/            ApiError, asyncHandler, text sanitising
```

## The rules this code follows

- **Every route validates its input with zod** before the controller runs, and
  the controller receives the parsed value.
- **Every failure is one shape:** `{ "error": { "message", "code?", "details?" } }`,
  produced only by `middleware/errorHandler.js`. Controllers `throw` an
  `ApiError`; `asyncHandler` routes rejections there.
- **Every credit movement runs in a transaction** (`db/withTransaction.js`) and
  writes a `Transaction` row. Balances are debited with the balance re-checked
  in the update's own filter, so two concurrent requests cannot overdraw an
  account. The sum of all user balances plus all tournament banks never changes
  except when credits are granted at the demo checkout.
- **`app.js` has no side effects,** so the same app object serves local
  development, the test suite, and the serverless deployment.
- **No `console.log`,** except the two startup lines in `index.js`.
