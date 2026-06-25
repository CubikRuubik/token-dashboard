import { cookies } from "next/headers";

const API_URL = process.env.NEST_API_URL;

export const AUTH_COOKIE = "access_token";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Reads the session cookie and turns it into a server-to-server Bearer header
// for the NestJS backend. Returns undefined when there is no session.
export async function authInit(): Promise<RequestInit | undefined> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}

async function request<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function apiErrorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("[bff] Unexpected error:", err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export const api = {
  get: <T = unknown>(path: string, init?: RequestInit) =>
    request<T>(path, init),
  post: <T = unknown>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      body: JSON.stringify(body),
    }),
  delete: (path: string, init?: RequestInit) =>
    request<void>(path, { ...init, method: "DELETE" }),
};
