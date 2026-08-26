/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * pipeline instead of hanging the request. Handlers can then `throw` freely and
 * carry no try/catch noise.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<unknown>} handler
 */
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
