import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '/src/features/auth/AuthProvider.jsx'

/**
 * Everything the app needs in scope, in one place.
 *
 * The order matters: routing outside auth, because the guards navigate; auth
 * inside the query client, because the identity is itself a query.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Two components asking for the same thing in the same second should
      // produce one request, not two.
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      // A 4xx will not become a 2xx on the third attempt; only retry what might
      // genuinely be transient.
      retry: (failureCount, error) => {
        const status = error?.status ?? 0
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface-overlay)',
                color: 'var(--text-strong)',
                border: '1px solid var(--border-strong)',
                fontSize: 'var(--text-sm)',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
