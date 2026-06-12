'use client'
import Icon from './ui/Icon'
import { IoWallet } from 'react-icons/io5'

type View = 'dashboard' | 'activity' | 'tokens'

const NAV = [
  { id: 'dashboard' as View, icon: 'grid', label: 'Dashboard' },
  { id: 'activity' as View, icon: 'history', label: 'Activity' },
  { id: 'tokens' as View, icon: 'coins', label: 'Tokens' },
]

export default function Sidebar({
  view, setView, theme, toggleTheme, connected, onDisconnect,
}: {
  view: View
  setView: (v: View) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
  connected: boolean
  onDisconnect: () => void
}) {
  return (
    <aside className="rail">
      <div className="rail-logo"><IoWallet size={28} color="var(--accent)" /></div>
      <nav className="rail-nav">
        {NAV.map(n => (
          <button key={n.id} className={`rail-btn ${view === n.id ? 'active' : ''}`}
            title={n.label} onClick={() => setView(n.id)}>
            <Icon name={n.icon} />
          </button>
        ))}
      </nav>
      <div className="rail-spacer" />
      <button className="rail-btn" title={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <button className="rail-btn" title="Disconnect" onClick={onDisconnect} disabled={!connected}>
        <Icon name="logout" />
      </button>
    </aside>
  )
}
