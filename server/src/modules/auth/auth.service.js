import bcrypt from 'bcrypt'
import User from '../../models/user.model.js'
import { ApiError } from '../../utils/ApiError.js'

const SALT_ROUNDS = 10

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
