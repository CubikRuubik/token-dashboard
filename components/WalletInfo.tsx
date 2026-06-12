'use client'

import { useAccount, useBalance } from 'wagmi'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function WalletInfo() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading } = useBalance({ address })

  if (!isConnected || !address) return null

  return (
    <div className="mt-6 p-4 rounded-lg border border-gray-200 space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-500 text-sm">Address</span>
        <span className="font-mono text-sm" title={address}>
          {shortenAddress(address)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 text-sm">ETH Balance</span>
        <span className="text-sm">
          {isLoading
            ? 'Loading...'
            : `${Number(balance?.formatted).toFixed(4)} ${balance?.symbol}`}
        </span>
      </div>
    </div>
  )
}
