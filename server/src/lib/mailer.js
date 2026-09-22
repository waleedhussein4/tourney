// Outbound transactional email, via Resend's REST API.
//
// A plain `fetch` call rather than the `resend` package: one endpoint, one
// shape, and Node 20 already has `fetch` — a dependency would buy nothing here.
//
// Failure policy: `sendMail`'s `critical` option decides whether a delivery
// failure fails the caller's request. It defaults to `true` — password reset,
// the only sender today, cannot silently do nothing and still tell the user
// "check your email". Anything added later that is merely informational
// (a notification, a digest) should pass `critical: false`: that mail failing
// must never be able to break the action that triggered it.
import config from '../config/env.js'

/** True when both the API key and the sender address are set. */
export const mailConfigured = config.resend.configured

/**
 * True when `sendMail` will actually deliver the message somewhere a developer
 * or a user can see it — a real send in production, the console elsewhere.
 * Callers gate on this rather than on `mailConfigured`, so local and test runs
 * exercise the whole flow with no account to set up.
 */
export const mailCanSend = mailConfigured || config.nodeEnv !== 'production'

// Resend can hang; an Express request must not hang with it. 10s is generous
// for a single REST call and still well inside anything a client will wait on.
const SEND_TIMEOUT_MS = 10_000
// One short, fixed backoff before the single retry — long enough to clear a
// transient blip, short enough not to meaningfully add to request latency.
const RETRY_DELAY_MS = 250

class MailSendError extends Error {
  constructor(message, { retryable }) {
    super(message)
    this.retryable = retryable
  }
}

/** One HTTP attempt against Resend. Never logs `to` or the message body. */
async function attemptSend({ to, subject, text, html }) {
  let response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: config.resend.mailFrom, to, subject, text, html }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })
  } catch {
    // Network failure or the timeout above firing — both are transient.
    throw new MailSendError('Resend request failed: network error or timeout', {
      retryable: true,
    })
  }

  if (response.ok) return

  // A 4xx (bad request, unverified sender, bad auth) will fail identically on
  // a retry — only a 5xx is worth a second attempt.
  throw new MailSendError(`Resend request failed (${response.status})`, {
    retryable: response.status >= 500,
  })
}

/**
 * Sends an email, or logs it in development.
 *
 * @param {{ to: string, subject: string, text: string, html?: string, critical?: boolean }} params
 */
export async function sendMail({ to, subject, text, html, critical = true }) {
  if (!mailConfigured) {
    if (config.nodeEnv === 'production') {
      if (critical) throw new Error('sendMail called while email is not configured')
      return
    }
    // eslint-disable-next-line no-console -- the only "send" a dev environment has.
    console.info(`[mailer] would send "${subject}" to ${to}:\n${text}`)
    return
  }

  try {
    await attemptSend({ to, subject, text, html })
  } catch (error) {
    if (!error.retryable) {
      if (critical) throw error
      return
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    try {
      await attemptSend({ to, subject, text, html })
    } catch (retryError) {
      if (critical) throw retryError
    }
  }
}
