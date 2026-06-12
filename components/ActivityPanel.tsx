'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Icon from './ui/Icon'

type Transfer = {
  id: number; tokenAddress: string; from: string; to: string;
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
        <div className="t1">{isIn ? 'Received' : 'Sent'}</div>
        <div className="t2">
          <span>{isIn ? 'From' : 'To'} {shortenAddr(isIn ? t.from : t.to)}</span>
          <span className="dotsep" />
          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="act-amt">
        <div className={`a num ${isIn ? 'in' : ''}`}>{isIn ? '+' : '−'}{t.amount}</div>
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
  const [transfers, setTransfers] = useState<Transfer[]>([])

  useEffect(() => {
    if (!address || !connected) return
    function fetch_() {
      fetch(`/api/transfers?address=${address}`)
        .then(r => r.json())
        .then(data => setTransfers(data))
        .catch(() => {})
    }
    fetch_()
    const id = setInterval(fetch_, 5000)
    return () => clearInterval(id)
  }, [address, connected])

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

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Recent activity</h2>
        {transfers.length > 0 && <span className="count">{transfers.length}</span>}
      </div>
      {transfers.length === 0 ? (
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
