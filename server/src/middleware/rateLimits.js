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
 * Demo checkout. Credits are free money in this app, so the cap is per account
 * rather than per address — otherwise one user behind a shared IP could block
 * everyone else, and one user with many addresses could mint without limit.
 */
export const creditsLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.userId ?? req.ip,
  message: 'Too many credit purchases in the last hour.',
})

/**
 * The scheduled reseed. One caller (Vercel Cron) hits it once a day, so a cap
 * this low costs nothing legitimate and takes brute-forcing the bearer token
 * off the table entirely.
 */
export const cronLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many requests.',
})
