import mongoose from 'mongoose'
import { ZodError } from 'zod'
import config from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * The single place an error becomes a response. Every failure leaves the API in
 * the same shape:
 *
 *   { "error": { "message": string, "code"?: string, "details"?: unknown } }
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
export function errorHandler(error, req, res, next) {
  const normalised = normalise(error)

  if (normalised.status >= 500 && !config.isTest) {
    // The only logging in the server: an unexpected failure, with its stack.
    // eslint-disable-next-line no-console
    console.error(`${req.method} ${req.originalUrl} →`, error)
  }

  const body = { message: normalised.message }
  if (normalised.code) body.code = normalised.code
  if (normalised.details !== undefined) body.details = normalised.details

  res.status(normalised.status).json({ error: body })
}

function normalise(error) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      message: error.message,
      code: error.code,
      details: error.details,
    }
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      message: 'Request validation failed',
      code: 'VALIDATION_FAILED',
      details: formatZodIssues(error),
    }
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      status: 400,
      message: 'Request validation failed',
      code: 'VALIDATION_FAILED',
      details: Object.values(error.errors).map((detail) => ({
        path: detail.path,
        message: detail.message,
      })),
    }
  }

  if (error instanceof mongoose.Error.CastError) {
    return { status: 400, message: `Invalid value for ${error.path}`, code: 'INVALID_ID' }
  }

  // Duplicate key on a unique index — the race the application-level "is it
  // taken?" check cannot close on its own.
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'value'
    return { status: 409, message: `That ${field} is already taken`, code: 'DUPLICATE' }
  }

  if (error?.type === 'entity.parse.failed') {
    return { status: 400, message: 'Request body is not valid JSON', code: 'INVALID_JSON' }
  }

  // Anything else is a bug. Callers get nothing that could leak internals.
  return {
    status: error?.status && error.status < 500 ? error.status : 500,
    message: 'Something went wrong on our end',
    code: 'INTERNAL_ERROR',
  }
}

export function formatZodIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}
