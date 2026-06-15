import { NextRequest } from 'next/server'
import { api, apiErrorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await api.post('/auth/verify', body)
    return Response.json(data)
  } catch (err) {
    return apiErrorResponse(err)
  }
}
