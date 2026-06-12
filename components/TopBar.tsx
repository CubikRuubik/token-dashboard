'use client'
import { useAccount, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import Icon from './ui/Icon'

type View = 'dashboard' | 'activity' | 'tokens'

const VIEW_META: Record<View, { icon: string; title: string; sub: string }> = {
  dashboard: { icon: 'grid', title: 'Dashboard', sub: 'Track balances and move your tokens' },
  activity: { icon: 'history', title: 'Activity', sub: 'Every transfer in and out of your wallet' },
  tokens: { icon: 'coins', title: 'Tokens', sub: 'Manage the tokens you\'re tracking' },
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function TopBar({
  view, connected, onConnect, onSend,
}: {
  view: View
  connected: boolean
  onConnect: (() => void) | undefined
  onSend: () => void
}) {
  const { address } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const m = VIEW_META[view]
  return (
    <header className="topbar">
      <div className="topbar-title">
        <div className="ico"><Icon name={m.icon} /></div>
        <div>
          <h1>{m.title}</h1>
          <p className="sub">{m.sub}</p>
        </div>
      </div>
      <div className="topbar-actions">
        {connected ? (
          <>
            <button className="btn btn-soft" onClick={onSend}>
              <Icon name="send" /> Send
            </button>
            <div className="net-pill">
              <span className="net-dot" />
              <span className="net-name">Sepolia</span>
            </div>
            {ethBalance && (
              <div className="net-pill">
                <span className="num">{parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)}</span>
                <span className="net-name">ETH</span>
              </div>
            )}
            <div className="wallet-pill">
              <span className="addr">{address ? shortenAddr(address) : ''}</span>
              <span className="avatar" />
            </div>
          </>
        ) : (
          <>
            <div className="net-pill">
              <span className="net-dot" />
              <span className="net-name">Sepolia</span>
            </div>
            <button className="btn btn-primary" onClick={onConnect}>
              <Icon name="wallet" /> Connect wallet
            </button>
          </>
        )}
      </div>
    </header>
  )
}
