import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

/** Call the Alltech API as the signed-in user.
 *
 * The Supabase session is the only credential. There is no second token stack
 * and nothing is written to localStorage by hand: the previous POS kept two
 * independent sets of encrypted tokens, one for this API and one for the
 * accessories service, which no longer exists. */
export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  let body = options.body
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  const send = async (token: string | undefined) => {
    const h = new Headers(headers)
    if (token) h.set('Authorization', `Bearer ${token}`)
    return fetch(`${BASE_URL}${path}`, { ...options, headers: h, body })
  }

  const { data } = await supabase.auth.getSession()
  let response = await send(data.session?.access_token)

  // A 401 on a request that carried a token means the token expired between
  // being read and being used. A POS sits open on a counter all day and the
  // access token rotates roughly hourly, so this is the normal case, not an
  // edge one -- it is what made enabling notifications fail with a 401 while
  // the same call worked from a fresh session.
  //
  // Refresh once and retry. Only once: if the refreshed token is also
  // rejected, the session is genuinely finished and looping would just delay
  // saying so.
  if (response.status === 401 && data.session) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      response = await send(refreshed.session.access_token)
    }
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let parsed: unknown = text
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    /* leave as text: an HTML error page from a proxy is not JSON */
  }

  if (!response.ok) {
    const detail =
      (parsed as { detail?: string; error?: string })?.detail ??
      (parsed as { error?: string })?.error ??
      `Request failed (${response.status})`
    throw new ApiError(response.status, detail, parsed)
  }

  return parsed as T
}


/** Pull a list out of whatever shape an endpoint returns.
 *
 * This API is not consistent: some endpoints wrap rows in `data`, the
 * paginated ones use DRF's `results`, and a couple return a bare array.
 * Guessing wrong does not throw -- it yields an empty list, so the screen
 * quietly claims there is nothing rather than failing visibly. That is exactly
 * how the dashboard came to report "everything is stocked" while two items
 * were low. */
export function listFrom<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    if (Array.isArray(record.results)) return record.results as T[]
    if (Array.isArray(record.data)) return record.data as T[]
    if (Array.isArray(record.items)) return record.items as T[]
  }
  return []
}
