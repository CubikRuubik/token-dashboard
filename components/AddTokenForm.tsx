'use client'

import { useState } from 'react'
import { isAddress } from 'viem'
import { erc20Abi } from 'viem'
import { useReadContracts, useChainId } from 'wagmi'

export default function AddTokenForm({ onTokenAdded }: { onTokenAdded: () => void }) {
  const [input, setInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const chainId = useChainId()

  const address = isAddress(input) ? input : undefined

  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      { address, abi: erc20Abi, functionName: 'name' },
      { address, abi: erc20Abi, functionName: 'symbol' },
      { address, abi: erc20Abi, functionName: 'decimals' },
    ],
    query: { enabled: !!address },
  })

  const name = data?.[0].result as string | undefined
  const symbol = data?.[1].result as string | undefined
  const decimals = data?.[2].result as number | undefined
  const isValidToken = !!name && !!symbol && decimals !== undefined

  async function handleAdd() {
    if (!address || !name || !symbol || decimals === undefined) return
    setIsSaving(true)
    await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, name, symbol, decimals, chainId }),
    })
    setInput('')
    setIsSaving(false)
    onTokenAdded()
  }

  return (
    <div className="mt-6 p-4 rounded-lg border border-gray-200 space-y-3">
      <h2 className="font-semibold">Add Token</h2>
      <input
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        placeholder="Paste ERC-20 contract address (0x...)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {input && !address && (
        <p className="text-red-500 text-sm">Invalid address format</p>
      )}

      {isLoading && (
        <p className="text-gray-400 text-sm">Fetching token info...</p>
      )}

      {address && !isLoading && isError && (
        <p className="text-red-500 text-sm">Not a valid ERC-20 contract</p>
      )}

      {isValidToken && (
        <div className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
          <span className="text-sm">
            {name}{' '}
            <span className="text-gray-400">({symbol})</span>
          </span>
          <button
            onClick={handleAdd}
            disabled={isSaving}
            className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800 disabled:opacity-40"
          >
            {isSaving ? 'Saving...' : 'Add Token'}
          </button>
        </div>
      )}
    </div>
  )
}
