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
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options.body
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers, body })

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
