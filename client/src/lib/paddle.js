/**
 * The card gateway's browser half.
 *
 * Loaded on demand rather than bundled: a visitor who never publishes a paid
 * tournament — which is nearly all of them — should not download a payments
 * SDK to look at a bracket.
 */

const SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js'

let loading

function loadScript() {
  loading ??= new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SRC}"]`)
    if (existing && window.Paddle) {
      resolve(window.Paddle)
      return
    }
    const script = document.createElement('script')
    script.src = SRC
    script.async = true
    script.onload = () => resolve(window.Paddle)
    script.onerror = () => {
      // Let the next attempt try again rather than caching the failure.
      loading = undefined
      reject(new Error('Could not load the payment form. Check your connection and try again.'))
    }
    document.head.append(script)
  })
  return loading
}

let initialisedFor

/**
 * Opens the gateway's overlay for a transaction the server created.
 *
 * Resolves when the host closes the overlay, whether they paid or not — the
 * payment itself is confirmed by the webhook, never by what the browser says.
 * `onPaid` fires when the overlay reports success, which is worth showing
 * immediately even though the tournament goes live on the server's word.
 *
 * @param {{transactionId: string, clientToken: string, environment: string,
 *          onPaid?: () => void}} options
 */
export async function openCheckout({ transactionId, clientToken, environment, onPaid }) {
  const Paddle = await loadScript()

  // `Initialize` is per token, and calling it twice with the same one throws.
  if (initialisedFor !== clientToken) {
    if (environment === 'sandbox') Paddle.Environment.set('sandbox')
    Paddle.Initialize({
      token: clientToken,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') onPaid?.()
      },
    })
    initialisedFor = clientToken
  }

  Paddle.Checkout.open({ transactionId, settings: { displayMode: 'overlay' } })
}
