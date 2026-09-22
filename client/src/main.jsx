import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { Providers } from './app/providers.jsx'
import App from './App.jsx'

// Free tier: errors only, no performance tracing. A no-op when
// VITE_SENTRY_DSN is unset — no network calls, no side effects.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0 })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
)
