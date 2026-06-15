'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Icon from './ui/Icon'
import { useAuth } from '@/lib/auth'

type Transfer = {
  id: number; tokenAddress: string; symbol?: string | null; from: string; to: string;
  amount: string; txHash: string; createdAt: string
}

function shortenAddr(a: string) { return `${a.slice(0,6)}...${a.slice(-4)}` }

function ActivityRow({ t, myAddress }: { t: Transfer; myAddress: string }) {
  const isIn = t.to.toLowerCase() === myAddress.toLowerCase()
  return (
    <div className="act-row">
      <div className={`act-ico ${isIn ? 'in' : 'out'}`}>
        <Icon name={isIn ? 'arrowDownLeft' : 'arrowUpRight'} />
      </div>
      <div className="act-main">
        <div className="t1">{isIn ? 'Received' : 'Sent'} {t.symbol ?? ''}</div>
        <div className="t2">
          <span>{isIn ? 'From' : 'To'} {shortenAddr(isIn ? t.from : t.to)}</span>
          <span className="dotsep" />
          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="act-amt">
        <div className={`a num ${isIn ? 'in' : ''}`}>{isIn ? '+' : '−'}{t.amount} {t.symbol ?? ''}</div>
      </div>
    </div>
  )
}

export default function ActivityPanel({
  connected, onViewAll,
}: {
  connected: boolean
  onViewAll: () => void
}) {
  const { address } = useAccount()
  const { jwt, signing, signIn } = useAuth()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!address || !connected || !jwt) return
    function fetch_() {
      const headers = { Authorization: `Bearer ${jwt}` }
      Promise.all([
        fetch(`/api/transfers?address=${address}`, { headers }).then(r => {
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
  }, [address, connected, jwt])

  if (!connected) {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Recent activity</h2></div>
        <div className="connect-overlay" style={{ padding: '40px 24px' }}>
          <div className="orb"><Icon name="history" /></div>
          <h3>No activity yet</h3>
          <p>Connect your wallet to see your transfer history.</p>
        </div>
      </section>
    )
  }

  const needsAuth = !jwt && !signing

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Recent activity</h2>
        {transfers.length > 0 && <span className="count">{transfers.length}</span>}
      </div>
      {signing ? (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
          Waiting for signature…
        </div>
      ) : needsAuth || fetchError === 'Session expired' ? (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
          <div style={{ marginBottom: 12 }}>{fetchError === 'Session expired' ? 'Session expired.' : 'Sign in to view your transfer history.'}</div>
          <button className="btn btn-primary" onClick={signIn}>Sign in with wallet</button>
        </div>
      ) : fetchError ? (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--negative, #e05)', fontSize: 13.5 }}>
          {fetchError}
        </div>
      ) : transfers.length === 0 ? (
        <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
          No transfers yet.
        </div>
      ) : (
        <div className="activity-list">
          {transfers.slice(0, 5).map(t => (
            <ActivityRow key={t.id} t={t} myAddress={address ?? ''} />
          ))}
        </div>
      )}
      {transfers.length > 0 && (
        <div className="panel-foot">
          <button className="link-btn" onClick={onViewAll}>
            View all activity <Icon name="chevronRight" />
          </button>
        </div>
      )}
    </section>
  )
}
