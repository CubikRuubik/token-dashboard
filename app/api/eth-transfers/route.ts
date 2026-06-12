import { NextRequest } from 'next/server'

// Captured once on first request — acts as the "app start" block.
// Only ETH transfers from this block onward will be returned.
let sessionFromBlock: string | null = null

async function getSessionFromBlock(httpUrl: string): Promise<string | null> {
  if (sessionFromBlock) return sessionFromBlock
  try {
    const res = await fetch(httpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 0 }),
    })
    const data = await res.json()
    sessionFromBlock = data.result as string
    console.log(`[eth-transfers] Session start block: ${parseInt(sessionFromBlock, 16)}`)
  } catch {
    // If this fails, proceed without a fromBlock filter
  }
  return sessionFromBlock
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (!address) return Response.json({ error: 'address required' }, { status: 400 })

  const httpUrl = process.env.ALCHEMY_WS_URL!.replace('wss://', 'https://')
  const fromBlock = await getSessionFromBlock(httpUrl)

  async function fetchTransfers(params: Record<string, string>) {
    const payload: Record<string, unknown> = {
      ...params,
      category: ['external'],
      excludeZeroValue: true,
      maxCount: '0x32',
    }
    if (fromBlock) payload.fromBlock = fromBlock

    const res = await fetch(httpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [payload],
      }),
    })
    const data = await res.json()
    return (data.result?.transfers ?? []) as AlchemyTransfer[]
  }

  const [sent, received] = await Promise.all([
    fetchTransfers({ fromAddress: address }),
    fetchTransfers({ toAddress: address }),
  ])

  const seen = new Set<string>()
  const merged = [...sent, ...received].filter(t => {
    if (seen.has(t.hash)) return false
    seen.add(t.hash)
    return true
  })

  merged.sort((a, b) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16))

  return Response.json(merged.map(t => ({
    id: t.hash,
    tokenAddress: 'ETH',
    symbol: 'ETH',
    from: t.from,
    to: t.to ?? '',
    amount: (t.value ?? 0).toFixed(6),
    txHash: t.hash,
    createdAt: t.metadata?.blockTimestamp ?? new Date().toISOString(),
  })))
}

type AlchemyTransfer = {
  blockNum: string
  hash: string
  from: string
  to: string | null
  value: number | null
  metadata?: { blockTimestamp?: string }
}
