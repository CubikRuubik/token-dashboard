'use client'
import { useEffect, useState } from 'react'
import { erc20Abi, formatUnits } from 'viem'
import { useReadContract, useAccount, useChainId } from 'wagmi'
import Icon from './ui/Icon'
import TokenBadge from './ui/TokenBadge'
import type { Token } from '@/lib/tokens'

function HoldingRow({
  token, connected, onSend,
}: {
  token: Token; connected: boolean; onSend: (id: number) => void
}) {
  const { address } = useAccount()
  const { data: balance, isLoading } = useReadContract({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address && connected },
  })

  const formatted = isLoading
    ? '...'
    : Number(formatUnits(balance ?? 0n, token.decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 })

  return (
    <div className="holding-row" onClick={() => connected && onSend(token.id)}>
      <div className="asset">
        <TokenBadge symbol={token.symbol} address={token.address} />
        <div className="asset-name">
          <span className="nm">{token.name}</span>
          <span className="sy num">{token.symbol}</span>
        </div>
      </div>
      <div className="bal-cell">
        <span className={`amt num ${!connected ? 'disconnected' : ''}`}>
          {connected ? formatted : '—'}
        </span>
        <span className="px num">{token.symbol}</span>
      </div>
      <div className="row-actions" onClick={e => e.stopPropagation()}>
        <button className="icon-btn" title={`Send ${token.symbol}`} disabled={!connected}
          onClick={() => onSend(token.id)}>
          <Icon name="send" />
        </button>
      </div>
    </div>
  )
}

export default function HoldingsPanel({
  connected, onSend, onConnect, onAddToken, refreshKey,
}: {
  connected: boolean
  onSend: (tokenId: number) => void
  onConnect: (() => void) | undefined
  onAddToken: () => void
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

  return (
    <section className={`panel ${!connected ? 'disconnected' : ''}`}>
      <div className="panel-head">
        <h2>Holdings</h2>
        <span className="count">{tokens.length}</span>
        <div className="head-actions">
          <button className="btn btn-ghost" style={{ height: 36, padding: '0 12px' }} onClick={onAddToken}>
            <Icon name="plus" /> Add
          </button>
        </div>
      </div>

      <div className="holdings-head">
        <span>Asset</span>
        <span>Balance</span>
        <span className="ta-r" />
      </div>

      {isLoading && (
        <div style={{ padding: '24px 22px', color: 'var(--text-faint)', fontSize: 13.5 }}>Loading...</div>
      )}

      {!isLoading && tokens.length === 0 && (
        <div style={{ padding: '34px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
          No tokens yet. Add one with the button above.
        </div>
      )}

      {tokens.map(t => (
        <HoldingRow key={`${t.chainId}-${t.address}`} token={t}
          connected={connected} onSend={onSend} />
      ))}

      {!connected && (
        <div className="panel-foot" style={{ padding: '16px 22px' }}>
          <button className="btn btn-primary" onClick={onConnect} style={{ margin: '0 auto' }}>
            <Icon name="wallet" /> Connect wallet to view balances
          </button>
        </div>
      )}
    </section>
  )
}
