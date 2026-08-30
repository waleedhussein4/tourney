// The Vercel serverless entrypoint.
//
// Vercel turns every file in this directory into a function and hands it the
// raw Node request and response, which is exactly what an Express app is: a
// `(req, res)` handler. So there is nothing to adapt — the same app that
// `server/src/index.js` calls `listen()` on locally is exported here.
//
// It must not listen, and it must not connect on import: `server/src/app.js`
// connects lazily on the first request that needs the database, and caches the
// connection on `globalThis` so a thawed container reuses it.

import app from '../server/src/app.js'

export default app
