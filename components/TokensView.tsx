'use client'
import { useEffect, useState } from 'react'
import { erc20Abi, formatUnits } from 'viem'
import { useReadContract, useAccount, useChainId } from 'wagmi'
import Icon from './ui/Icon'
import TokenBadge from './ui/TokenBadge'
import type { Token } from '@/lib/tokens'

function TokenRow({ token, onSend, onRemove }: { token: Token; onSend: (id: number) => void; onRemove: (t: Token) => void }) {
  const { address } = useAccount()
  const { data: balance, isLoading } = useReadContract({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    // Re-read on-chain balance periodically so it reflects transfers (~1 Sepolia block).
    query: { enabled: !!address, refetchInterval: 12_000 },
  })
  const formatted = isLoading ? '...' : Number(formatUnits(balance ?? 0n, token.decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 })

  return (
    <div className="holding-row" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.3fr) 200px', cursor: 'default' }}>
      <div className="asset">
        <TokenBadge symbol={token.symbol} address={token.address} />
        <div className="asset-name">
          <span className="nm">{token.name}</span>
          <span className="sy num">{token.symbol}</span>
        </div>
      </div>
      <div className="bal-cell">
        <span className="amt num">{formatted}</span>
        <span className="px num">{token.symbol}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" style={{ height: 36, padding: '0 13px' }} onClick={() => onSend(token.id)}>
          <Icon name="send" /> Send
        </button>
        <button className="icon-btn" title={`Stop tracking ${token.symbol}`} onClick={() => onRemove(token)} style={{ width: 36, height: 36 }}>
          <Icon name="x" />
        </button>
      </div>
    </div>
  )
}

export default function TokensView({
  onAddToken, onSend, refreshKey,
}: {
  onAddToken: () => void
  onSend: (tokenId: number) => void
  refreshKey: number
}) {
  const chainId = useChainId()
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/tokens?chainId=${chainId}`)
      .then(r => r.json())
      .then(data => { setTokens(data); setIsLoading(false) })
  }, [chainId, refreshKey])

  async function handleRemove(token: Token) {
    await fetch(`/api/tokens/${token.id}`, { method: 'DELETE' })
    setTokens(prev => prev.filter(t => t.id !== token.id))
  }

  return (
    <div className="content-inner">
      <div className="view-title">
        <div>
          <h2>Tokens</h2>
          <p>ERC-20 tokens you're tracking. Add any token by contract address.</p>
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={onAddToken}>
          <Icon name="plus" /> Add token
        </button>
      </div>

      <section className="panel">
        <div className="holdings-head" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.3fr) 200px' }}>
          <span>Asset</span><span>Balance</span><span />
        </div>
        {isLoading && (
          <div style={{ padding: '24px 22px', color: 'var(--text-faint)', fontSize: 13.5 }}>Loading...</div>
        )}
        {!isLoading && tokens.length === 0 && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
            You're not tracking any tokens. Add one by its contract address.
          </div>
        )}
        {tokens.map(t => (
          <TokenRow key={`${t.chainId}-${t.address}`} token={t} onSend={onSend} onRemove={handleRemove} />
        ))}
      </section>
    </div>
  )
}
