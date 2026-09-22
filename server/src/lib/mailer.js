// Outbound transactional email, via Resend's REST API.
//
// A plain `fetch` call rather than the `resend` package: one endpoint, one
// shape, and Node 20 already has `fetch` — a dependency would buy nothing here.
import config from '../config/env.js'

/**
 * Sends an email, or logs it.
 *
 * In development with no RESEND_API_KEY configured, the email is written to
 * the console instead of sent — so the password-reset flow works locally with
 * zero setup. In production, env.js already refuses to boot without the key
 * (see `config.resend`), so this branch is unreachable there.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} params
 */
export async function sendMail({ to, subject, text, html }) {
  if (!config.resend.apiKey) {
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
