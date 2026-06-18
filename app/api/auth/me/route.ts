import { cookies } from 'next/headers'
import { AUTH_COOKIE } from '@/lib/api'

// Reports the wallet of the current session, so the client can restore auth
// state on load without being able to read the httpOnly cookie itself.
// The JWT payload is only decoded for this UI hint — every data request is
// still verified by the backend.
export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) return Response.json({ address: null })

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return Response.json({ address: null })
    }
    return Response.json({ address: payload.sub ?? null })
  } catch {
    return Response.json({ address: null })
  }
}
