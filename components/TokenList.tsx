'use client'

import { useEffect, useState } from 'react'
import { erc20Abi, formatUnits } from 'viem'
import { useReadContract, useAccount, useChainId } from 'wagmi'
import { type Token } from '@/lib/tokens'

function TokenItem({
  token,
  isSelected,
  onSelect,
  onRemove,
}: {
  token: Token
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { address } = useAccount()

  const { data: balance, isLoading } = useReadContract({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  })

  const formatted = isLoading
    ? '...'
    : `${Number(formatUnits(balance ?? 0n, token.decimals)).toFixed(4)} ${token.symbol}`

  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer border ${
        isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <div>
        <span className="font-medium text-sm">{token.symbol}</span>
        <span className="text-gray-400 text-xs ml-2">{token.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono">{formatted}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-xs text-red-400 hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

export default function TokenList({
  selectedToken,
  onSelectToken,
}: {
  selectedToken: Token | null
  onSelectToken: (token: Token | null) => void
}) {
  const chainId = useChainId()
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/tokens?chainId=${chainId}`)
      .then((res) => res.json())
      .then((data) => setTokens(data))
      .finally(() => setIsLoading(false))
  }, [chainId])

  async function handleRemove(token: Token) {
    await fetch(`/api/tokens/${token.id}`, { method: 'DELETE' })
    setTokens((prev) => prev.filter((t) => t.id !== token.id))
    if (selectedToken?.id === token.id) onSelectToken(null)
  }

  if (isLoading) {
    return <p className="text-gray-400 text-sm mt-6">Loading tokens...</p>
  }

  if (tokens.length === 0) {
    return (
      <p className="text-gray-400 text-sm mt-6">
        No tokens added yet. Paste a contract address above to get started.
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-2">
      <h2 className="font-semibold">Your Tokens</h2>
      {tokens.map((token) => (
        <TokenItem
          key={`${token.chainId}-${token.address}`}
          token={token}
          isSelected={selectedToken?.id === token.id}
          onSelect={() => onSelectToken(token)}
          onRemove={() => handleRemove(token)}
        />
      ))}
    </div>
  )
}
