import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import User from '../../models/user.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { sendMail, mailCanSend } from '../../lib/mailer.js'

const SALT_ROUNDS = 10
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

/** sha256 of the raw token — the same idea as a password hash, without the
 * deliberate slowness bcrypt adds for a value that is already 32 random bytes. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Creates an account.
 *
 * The email/username availability checks are a courtesy that produces a good
 * error message; the unique indexes are what actually guarantee it. A duplicate
 * that slips through the gap between check and insert surfaces as a 11000 error,
 * which `errorHandler` reports as a 409 — so the original bug where a failed
 * insert was swallowed and `undefined` was signed into a token cannot recur.
 */
export async function registerUser({ email, username, password }) {
  const [emailTaken, usernameTaken] = await Promise.all([
    User.exists({ email }),
    User.exists({ username }),
  ])
  if (emailTaken) throw ApiError.conflict('That email is already registered')
  if (usernameTaken) throw ApiError.conflict('That username is already taken')

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  return User.create({ email, username, password: passwordHash })
}

/**
 * Verifies credentials.
 *
 * Both failure modes return the same message: telling an attacker that an email
 * exists but the password was wrong is a free account-enumeration oracle. The
 * hash comparison runs even when there is no such user so the two paths take
 * comparable time.
 */
export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password')

  const hash =
    user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
  const matches = await bcrypt.compare(password, hash)

  if (!user || !matches) throw ApiError.unauthorized('Incorrect email or password')

  return user
}

/**
 * Sends (or resends) a verification link for an account that has not proven
 * its email yet.
 *
 * Best-effort: unlike a password reset, an unsent verification email must
 * never fail the request that triggered it — signing up still creates the
 * account, and a resend still answers success, even when mail is unconfigured
 * or Resend is briefly down. `critical: false` is what buys that.
 */
export async function sendVerificationEmail(user, verifyUrlBase) {
  const token = crypto.randomBytes(32).toString('hex')
  user.verifyEmailToken = hashToken(token)
  user.verifyEmailExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)
  await user.save()

  const verifyUrl = `${verifyUrlBase}/verify-email?token=${token}`
  await sendMail({
    to: user.email,
    subject: 'Verify your Tourney email',
    text: `Verify your email: ${verifyUrl}\n\nThis link expires in 24 hours. If you did not create this account, ignore this email.`,
    critical: false,
  })
}

/**
 * Resends a verification link to the signed-in caller.
 */
export async function resendVerification(userId, verifyUrlBase) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('User not found')
  if (user.emailVerified) {
    throw new ApiError(409, 'This email is already verified', { code: 'VERIFY_ALREADY_DONE' })
  }
  await sendVerificationEmail(user, verifyUrlBase)
}

/**
 * Completes email verification.
 *
 * The token hash is left in place once used — see the model — so a second
 * request with the same link is told apart from one that is merely made up:
 * `emailVerified` already being true is what actually blocks the replay.
 */
export async function verifyEmail(token) {
  const user = await User.findOne({ verifyEmailToken: hashToken(token) }).select(
    '+verifyEmailToken +verifyEmailExpires'
  )
  if (!user) {
    throw new ApiError(400, 'That verification link is invalid', { code: 'VERIFY_INVALID' })
  }
  if (user.emailVerified) {
    throw new ApiError(409, 'This email is already verified', { code: 'VERIFY_ALREADY_DONE' })
  }
  if (user.verifyEmailExpires < new Date()) {
    throw new ApiError(400, 'That verification link has expired', { code: 'VERIFY_EXPIRED' })
  }

  user.emailVerified = true
  await user.save()
  return user
}

/**
 * Starts a password reset, if the email belongs to an account.
 *
 * Always resolves the same way whether or not the account exists — a
 * different response, or an error, would tell a caller which emails are
 * registered.
 */
export async function requestPasswordReset({ email, resetUrlBase }) {
  // Checked before the lookup, so an unconfigured deployment answers the same
  // way for every address and still cannot be used to probe for accounts.
  if (!mailCanSend) {
    throw new ApiError(503, 'Password reset is not configured on this deployment', {
      code: 'MAIL_UNAVAILABLE',
    })
  }

  const user = await User.findOne({ email })
  if (!user) return

  const token = crypto.randomBytes(32).toString('hex')
  user.resetPasswordToken = hashToken(token)
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  const resetUrl = `${resetUrlBase}/reset-password?token=${token}`
  await sendMail({
    to: user.email,
    subject: 'Reset your Tourney password',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, ignore this email.`,
  })
}

/**
 * Completes a password reset: verifies the token, sets the new password, and
 * invalidates the token so it cannot be replayed.
 */
export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires')

  if (!user) throw ApiError.badRequest('That reset link is invalid or has expired')

  user.password = await bcrypt.hash(password, SALT_ROUNDS)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  return user
}
