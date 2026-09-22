import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import User from '../../models/user.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { sendMail } from '../../lib/mailer.js'

const SALT_ROUNDS = 10
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000

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
 * Starts a password reset, if the email belongs to an account.
 *
 * Always resolves the same way whether or not the account exists — a
 * different response, or an error, would tell a caller which emails are
 * registered.
 */
export async function requestPasswordReset({ email, resetUrlBase }) {
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
