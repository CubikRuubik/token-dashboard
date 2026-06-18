import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { api, apiErrorResponse, AUTH_COOKIE } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await api.post<{ address: string; token: string }>('/auth/verify', body)

    // Store the JWT as a first-party httpOnly cookie on the Next.js origin.
    // The browser never sees the token; proxy routes read it server-side.
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    })

    return Response.json({ address: data.address })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
