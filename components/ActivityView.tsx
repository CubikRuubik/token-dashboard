'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Icon from './ui/Icon'
import TokenBadge from './ui/TokenBadge'
import { useAuth } from '@/lib/auth'

type Transfer = {
  id: number; tokenAddress: string; symbol?: string | null; from: string; to: string;
  amount: string; txHash: string; createdAt: string
}

function shortenAddr(a: string) { return `${a.slice(0,6)}...${a.slice(-4)}` }

export default function ActivityView() {
  const { address } = useAccount()
  const { isAuthed, signing, signIn } = useAuth()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all')
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!address || !isAuthed) return
    function fetch_() {
      // Session cookie is sent automatically on these same-origin requests.
      Promise.all([
        fetch(`/api/transfers?address=${address}`).then(r => {
          if (r.status === 401) throw new Error('auth')
          if (!r.ok) throw new Error(r.status === 503 ? 'Backend unavailable' : 'Transfer history failed to load')
          return r.json()
        }),
        fetch(`/api/eth-transfers?address=${address}`).then(r => {
          if (!r.ok) throw new Error(r.status === 503 ? 'Backend unavailable' : 'Transfer history failed to load')
          return r.json()
        }),
      ]).then(([erc20, eth]) => {
        setFetchError(null)
        const combined = [...erc20, ...eth].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setTransfers(combined)
      }).catch((err: Error) => setFetchError(err.message === 'auth' ? 'Session expired' : err.message))
    }
    fetch_()
    const id = setInterval(fetch_, 5000)
    return () => clearInterval(id)
  }, [address, isAuthed])

  const rows = transfers.filter(t => {
    if (filter === 'all') return true
    const isIn = t.to.toLowerCase() === (address ?? '').toLowerCase()
    return filter === 'in' ? isIn : !isIn
  })

  const FILTERS = [
    { id: 'all' as const, label: 'All' },
    { id: 'in' as const, label: 'Received' },
    { id: 'out' as const, label: 'Sent' },
  ]

  const needsAuth = !isAuthed && !signing

  return (
    <div className="content-inner">
      <div className="view-title">
        <div>
          <h2>Activity</h2>
          <p>Every transfer in and out of your wallet, indexed on-chain.</p>
        </div>
      </div>

      <section className="panel hist-table">
        <div className="panel-head">
          <h2>Transfers</h2>
          <span className="count">{rows.length}</span>
          <div className="head-actions">
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  border: 'none', cursor: 'pointer', borderRadius: 7, padding: '6px 13px',
                  fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                  background: filter === f.id ? 'var(--surface-1)' : 'transparent',
                  color: filter === f.id ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: filter === f.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="hist-head">
          <span>Type</span>
          <span>Token</span>
          <span>Amount</span>
          <span>Counterparty</span>
          <span>Date</span>
          <span>Tx</span>
        </div>

        {signing && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
            Waiting for signature…
          </div>
        )}
        {(needsAuth || fetchError === 'Session expired') && !signing && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
            <div style={{ marginBottom: 12 }}>{fetchError === 'Session expired' ? 'Session expired.' : 'Sign in to view your transfer history.'}</div>
            <button className="btn btn-primary" onClick={signIn}>Sign in with wallet</button>
          </div>
        )}
        {fetchError && fetchError !== 'Session expired' && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--negative, #e05)', fontSize: 13.5 }}>
            {fetchError}
          </div>
        )}
        {!fetchError && !needsAuth && !signing && rows.length === 0 && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
            No transfers yet.
          </div>
        )}

        {rows.map(t => {
          const isIn = t.to.toLowerCase() === (address ?? '').toLowerCase()
          return (
            <div className="hist-row" key={t.id}>
              <span>
                <span className={`tag ${isIn ? 'in' : 'out'}`}>
                  <Icon name={isIn ? 'arrowDownLeft' : 'arrowUpRight'} />
                  {isIn ? 'Received' : 'Sent'}
                </span>
              </span>
              <span className="asset">
                {t.tokenAddress === 'ETH' ? (
                  <span className="tok sm" style={{ background: 'radial-gradient(120% 120% at 30% 20%, #627eea, #3a56c4)' }}>ETH</span>
                ) : (
                  <TokenBadge symbol={t.symbol ?? t.tokenAddress.slice(2, 6).toUpperCase()} address={t.tokenAddress} size="sm" />
                )}
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  {t.tokenAddress === 'ETH' ? (
                    <span style={{ color: 'var(--text-muted)' }}>Ether</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>{shortenAddr(t.tokenAddress)}</span>
                  )}
                </span>
              </span>
              <span>
                <span className="num" style={{ fontWeight: 600, color: isIn ? 'var(--positive)' : 'var(--text)' }}>
                  {isIn ? '+' : '−'}{t.amount}
                </span>
              </span>
              <span className="mono-faint">{shortenAddr(isIn ? t.from : t.to)}</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {new Date(t.createdAt).toLocaleString()}
              </span>
              <span>
                <a className="tx-link" href={`https://sepolia.etherscan.io/tx/${t.txHash}`}
                  target="_blank" rel="noopener noreferrer">
                  {t.txHash.slice(0,8)}… <Icon name="external" />
                </a>
              </span>
            </div>
          )
        })}
      </section>
    </div>
  )
}
