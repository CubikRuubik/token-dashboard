import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

import { createPublicClient, webSocket, erc20Abi, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../app/generated/prisma/client'

const wsUrl = process.env.ALCHEMY_WS_URL

if (!wsUrl) {
  console.error('Missing ALCHEMY_WS_URL in .env.local')
  process.exit(1)
}

const client = createPublicClient({
  chain: sepolia,
  transport: webSocket(wsUrl),
})

async function main() {
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  // Tell SQLite to wait up to 5s when the DB is locked instead of failing immediately
  await prisma.$executeRaw`PRAGMA busy_timeout = 5000`

  const tokens = await prisma.token.findMany()

  if (tokens.length === 0) {
    console.log('No tokens in DB yet. Add a token in the UI first.')
    process.exit(0)
  }

  for (const { address: tokenAddress } of tokens) {
    const address = tokenAddress as `0x${string}`

    let decimals: number
    try {
      decimals = await client.readContract({
        address,
        abi: erc20Abi,
        functionName: 'decimals',
      })
    } catch (err) {
      console.error(`\nFailed to connect to Sepolia RPC.`)
      console.error(`Check that ALCHEMY_WS_URL in .env.local is correct and the key is valid.`)
      console.error(`Current value: ${wsUrl}\n`)
      console.error(`Original error: ${(err as Error).message}`)
      process.exit(1)
    }

    console.log(`Watching ${address} (decimals: ${decimals})`)

    client.watchContractEvent({
      address,
      abi: erc20Abi,
      eventName: 'Transfer',
      onLogs: async (logs) => {
        for (const log of logs) {
          const { from, to, value } = log.args
          if (!from || !to || value === undefined || !log.transactionHash) continue

          const amount = formatUnits(value, decimals)

          await prisma.transfer.upsert({
            where: { txHash: log.transactionHash },
            update: {},
            create: {
              tokenAddress: address,
              from,
              to,
              amount,
              txHash: log.transactionHash,
            },
          })

          console.log(`Transfer: ${from.slice(0, 8)}... → ${to.slice(0, 8)}... ${amount}`)
        }
      },
      onError: (error) => {
        console.error(`\nWebSocket error for ${address}:`, error.message)
        console.error(`The indexer may have lost connection — check your ALCHEMY_WS_URL.\n`)
      },
    })
  }

  console.log(`Indexer running, watching ${tokens.length} token(s)...`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
