import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')

  if (!address) {
    return Response.json({ error: 'address query param is required' }, { status: 400 })
  }

  const transfers = await prisma.transfer.findMany({
    where: { OR: [{ from: address }, { to: address }] },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(transfers)
}
