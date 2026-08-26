import { ApiError } from '../utils/ApiError.js'

/** Turns an unmatched route into the same JSON error shape as everything else. */
export function notFound(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`, { code: 'NO_ROUTE' }))
}
