import { NextRequest } from 'next/server'
import { api, apiErrorResponse } from '@/lib/api'

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (!address) return Response.json({ error: 'address query param is required' }, { status: 400 })

  const auth = request.headers.get('authorization')
  const init = auth ? { headers: { Authorization: auth } } : undefined

  try {
    const data = await api.get(`/transfers?address=${address}`, init)
    return Response.json(data)
  } catch (err) {
    return apiErrorResponse(err)
  }
}
