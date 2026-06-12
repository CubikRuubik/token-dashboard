'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

type Transfer = {
  id: number
  tokenAddress: string
  from: string
  to: string
  amount: string
  txHash: string
  createdAt: string
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function TransferHistory() {
  const { address, isConnected } = useAccount()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    function fetchTransfers() {
      fetch(`/api/transfers?address=${address}`)
        .then((res) => res.json())
        .then((data) => setTransfers(data))
        .finally(() => setIsLoading(false))
    }

    setIsLoading(true)
    fetchTransfers()

    const interval = setInterval(fetchTransfers, 5000)
    return () => clearInterval(interval)
  }, [address])

  if (!isConnected) return null

  return (
    <div className="mt-6">
      <h2 className="font-semibold mb-3">Transfer History</h2>

      {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!isLoading && transfers.length === 0 && (
        <p className="text-gray-400 text-sm">No transfers yet.</p>
      )}

      {transfers.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Token</th>
                <th className="px-3 py-2 text-left">From</th>
                <th className="px-3 py-2 text-left">To</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Tx</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">
                    {shortenAddress(t.tokenAddress)}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    <span className={t.from === address ? 'text-red-500' : ''}>
                      {shortenAddress(t.from)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">
                    <span className={t.to === address ? 'text-green-500' : ''}>
                      {shortenAddress(t.to)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{t.amount}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${t.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline font-mono"
                    >
                      {shortenAddress(t.txHash)}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
