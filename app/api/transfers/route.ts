import { NextRequest } from 'next/server'
import { api, apiErrorResponse } from '@/lib/api'

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (!address) return Response.json({ error: 'address query param is required' }, { status: 400 })
  try {
    const data = await api.get(`/transfers?address=${address}`)
    return Response.json(data)
  } catch (err) {
    return apiErrorResponse(err)
  }
}
