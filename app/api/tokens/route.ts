import { NextRequest } from 'next/server'
import { api, apiErrorResponse } from '@/lib/api'

export async function GET(request: NextRequest) {
  const chainId = request.nextUrl.searchParams.get('chainId')
  if (!chainId) return Response.json({ error: 'chainId query param is required' }, { status: 400 })
  try {
    const data = await api.get(`/tokens?chainId=${chainId}`)
    return Response.json(data)
  } catch (err) {
    return apiErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await api.post('/tokens', body)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
