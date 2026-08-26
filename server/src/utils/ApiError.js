/**
 * A failure a client is allowed to see: a status code, a human-readable message,
 * and optionally a stable machine code and structured details.
 *
 * Controllers and services `throw` these; `errorHandler` turns them into the
 * one JSON error shape the API emits. Anything else that escapes a handler is
 * treated as a bug and reported as an opaque 500.
 */
export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message, options) {
    return new ApiError(400, message, options)
  }

  static unauthorized(message = 'Authentication required', options) {
    return new ApiError(401, message, options)
  }

  static forbidden(message = 'You do not have access to this resource', options) {
    return new ApiError(403, message, options)
  }

  static notFound(message = 'Not found', options) {
    return new ApiError(404, message, options)
  }

  static conflict(message, options) {
    return new ApiError(409, message, options)
  }
}
