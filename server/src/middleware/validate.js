import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import { formatZodIssues } from './errorHandler.js'

/**
 * Validates `params`, `query`, and `body` against zod schemas before the
 * controller runs, and replaces each with the parsed result — so handlers get
 * coerced, trimmed, known-shaped data and never re-check types.
 *
 * Any part left unspecified is passed through untouched.
 *
 * @param {{ params?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, body?: import('zod').ZodTypeAny }} schemas
 */
export function validate(schemas) {
  return function validateRequest(req, _res, next) {
    try {
      for (const part of ['params', 'query', 'body']) {
        const schema = schemas[part]
        if (!schema) continue
        const parsed = schema.parse(req[part] ?? {})
        // Express 4 exposes `req.query` as a getter on some versions; defining
        // the property keeps the assignment working either way.
        Object.defineProperty(req, part, { value: parsed, writable: true, configurable: true })
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          ApiError.badRequest('Request validation failed', {
            code: 'VALIDATION_FAILED',
            details: formatZodIssues(error),
          })
        )
        return
      }
      next(error)
    }
  }
}
