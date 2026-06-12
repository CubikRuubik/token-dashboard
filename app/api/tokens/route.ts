import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const chainId = request.nextUrl.searchParams.get('chainId')

  if (!chainId) {
    return Response.json({ error: 'chainId query param is required' }, { status: 400 })
  }

  const tokens = await prisma.token.findMany({
    where: { chainId: Number(chainId) },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json(tokens)
}

export async function POST(request: NextRequest) {
  const { address, name, symbol, decimals, chainId } = await request.json()

  if (!address || !name || !symbol || decimals === undefined || !chainId) {
    return Response.json({ error: 'address, name, symbol, decimals, and chainId are required' }, { status: 400 })
  }

  const token = await prisma.token.upsert({
    where: { address_chainId: { address, chainId } },
    update: {},
    create: { address, name, symbol, decimals, chainId },
  })

  return Response.json(token, { status: 201 })
}
