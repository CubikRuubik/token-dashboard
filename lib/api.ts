const API_URL = process.env.NEST_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...init })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text || `API error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export function apiErrorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  console.error('[bff] Unexpected error:', err)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  delete: (path: string) =>
    request<void>(path, { method: 'DELETE' }),
}
