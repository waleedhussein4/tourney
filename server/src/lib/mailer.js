// Outbound transactional email, via Resend's REST API.
//
// A plain `fetch` call rather than the `resend` package: one endpoint, one
// shape, and Node 20 already has `fetch` — a dependency would buy nothing here.
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

/**
 * Sends an email, or logs it in development.
 *
 * Callers must check `mailConfigured` first and refuse the request themselves,
 * so the user gets a real error instead of a success response for a mail that
 * was never sent. Throwing here as a backstop makes a misuse loud rather than
 * silent.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} params
 */
export async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured) {
    if (config.nodeEnv === 'production') {
      throw new Error('sendMail called while email is not configured')
    }
    // eslint-disable-next-line no-console -- the only "send" a dev environment has.
    console.info(`[mailer] would send "${subject}" to ${to}:\n${text}`)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.resend.mailFrom, to, subject, text, html }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend request failed (${response.status}): ${body}`)
  }
}
