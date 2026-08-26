/*
 * The one place the app talks to the network.
 *
 * Every call goes through `request`, so authentication, JSON encoding, and error
 * shape are decided once. The API answers failures as
 * `{ error: { message, code?, details? } }`; this turns that into a thrown
 * `ApiError` with the message already extracted, which is what React Query
 * surfaces to the UI.
 */

/**
 * Base URL for the API.
 *
 * Empty by default, so requests go to a same-origin relative `/api` path: Vite
 * proxies that in development, and the client and API share an origin in
 * production. Set `VITE_API_URL` only to point at an API on another host.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** True when the caller is not signed in, or their session has expired. */
  get isUnauthorized() {
    return this.status === 401
  }

  /**
   * The per-field messages a validation failure carries, keyed by field name —
   * ready to hand to react-hook-form.
   */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {}
    return Object.fromEntries(
      this.details.filter((detail) => detail.path).map((detail) => [detail.path, detail.message])
    )
  }
}

function buildUrl(path, query) {
  const url = `${BASE_URL}${path}`
  if (!query) return url

  // Undefined and empty values are omitted rather than sent as "undefined".
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }

  const search = params.toString()
  return search ? `${url}?${search}` : url
}

/**
 * Performs a request and returns the parsed body.
 *
 * @param {string} path Path beginning with `/api`.
 * @param {{ method?: string, body?: unknown, query?: Record<string, unknown>, signal?: AbortSignal }} [options]
 */
export async function request(path, { method = 'GET', body, query, signal } = {}) {
  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      // The session is an httpOnly cookie, so every request has to carry it.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause.name === 'AbortError') throw cause
    throw new ApiError('Could not reach the server. Check your connection and try again.', {
      status: 0,
    })
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? 'Something went wrong. Please try again.', {
      status: response.status,
      code: payload?.error?.code,
      details: payload?.error?.details,
    })
  }

  return payload
}

export const get = (path, options) => request(path, { ...options, method: 'GET' })
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body })
export const patch = (path, body, options) => request(path, { ...options, method: 'PATCH', body })
export const del = (path, options) => request(path, { ...options, method: 'DELETE' })
