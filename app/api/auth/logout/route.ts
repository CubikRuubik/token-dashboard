import { cookies } from 'next/headers'
import { AUTH_COOKIE } from '@/lib/api'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
  return Response.json({ ok: true })
}
