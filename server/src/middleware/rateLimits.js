import rateLimit from 'express-rate-limit'
import config from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

// Limits are a nuisance in development and in tests, where a suite fires
// hundreds of requests from one address in seconds.
const enabled = config.isProduction

function limiter({ windowMs, max, message, keyGenerator }) {
  return rateLimit({
    windowMs,
    max,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !enabled,
    handler: (_req, _res, next) => next(new ApiError(429, message, { code: 'RATE_LIMITED' })),
  })
}

/** Signup and login: slows credential stuffing without annoying real users. */
export const authLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Try again in a few minutes.',
})

/**
 * Opening a checkout. Capped per account rather than per address: one organiser
 * behind a shared connection must not be able to lock out everyone else on it.
 */
export const checkoutLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId ?? req.ip,
  message: 'Too many checkout attempts in the last hour.',
})

/**
 * Filing a report. Capped per account so the admin queue cannot be flooded by
 * one caller repeating the same complaint.
 */
export const reportLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.userId ?? req.ip,
  message: 'Too many reports in the last hour.',
})

/**
 * The scheduled reseed. One caller (the Cloudflare Cron Trigger) hits it once a
 * day, so a cap this low costs nothing legitimate and takes brute-forcing the
 * bearer token off the table entirely.
 */
export const cronLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many requests.',
})
