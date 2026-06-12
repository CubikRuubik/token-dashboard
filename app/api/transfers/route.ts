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

  // Resolve symbols for all unique token addresses in one query
  const addresses = [...new Set(transfers.map(t => t.tokenAddress))]
  const tokens = await prisma.token.findMany({
    where: { address: { in: addresses } },
    select: { address: true, symbol: true },
  })
  const symbolMap = Object.fromEntries(tokens.map(t => [t.address.toLowerCase(), t.symbol]))

  return Response.json(transfers.map(t => ({
    ...t,
    symbol: symbolMap[t.tokenAddress.toLowerCase()] ?? null,
  })))
}
