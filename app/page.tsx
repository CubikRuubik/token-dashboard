'use client'
import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import HoldingsPanel from '@/components/HoldingsPanel'
import ActivityPanel from '@/components/ActivityPanel'
import ActivityView from '@/components/ActivityView'
import TokensView from '@/components/TokensView'
import AddTokenModal from '@/components/modals/AddTokenModal'
import SendModal from '@/components/modals/SendModal'
import ReceiveModal from '@/components/modals/ReceiveModal'
import Toast from '@/components/ui/Toast'

type View = 'dashboard' | 'activity' | 'tokens'
type Modal =
  | { type: 'add' }
  | { type: 'send'; tokenId?: number }
  | { type: 'receive' }

export default function Home() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()

  const [view, setView] = useState<View>('dashboard')
  const [modal, setModal] = useState<Modal | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const openAdd = () => setModal({ type: 'add' })
  const openSend = (tokenId?: number) => setModal({ type: 'send', tokenId })
  const openReceive = () => setModal({ type: 'receive' })
  const closeModal = () => setModal(null)
  const showToast = (msg: string) => setToast(msg)

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        connected={isConnected}
        onDisconnect={disconnect}
      />

      <div className="main">
        <TopBar
          view={view}
          connected={isConnected}
          onConnect={openConnectModal}
          onAddToken={openAdd}
          onSend={() => openSend()}
        />

        <div className="content">
          {view === 'dashboard' && (
            <div className="dash-grid">
              <HoldingsPanel
                connected={isConnected}
                onSend={openSend}
                onReceive={openReceive}
                onConnect={openConnectModal}
                onAddToken={openAdd}
                refreshKey={tokenRefreshKey}
              />
              <ActivityPanel
                connected={isConnected}
                onViewAll={() => setView('activity')}
              />
            </div>
          )}
          {view === 'activity' && <ActivityView />}
          {view === 'tokens' && (
            <TokensView
              onAddToken={openAdd}
              onSend={openSend}
              refreshKey={tokenRefreshKey}
            />
          )}
        </div>
        <footer className="dash-footer">
          <span>© TokenDashboard, 2026</span>
        </footer>
      </div>

      {modal?.type === 'add' && (
        <AddTokenModal
          onClose={closeModal}
          onAdded={sym => { closeModal(); showToast(`${sym} added to your watchlist`); setTokenRefreshKey(k => k + 1) }}
        />
      )}
      {modal?.type === 'send' && (
        <SendModal
          initialTokenId={modal.tokenId}
          onClose={closeModal}
          onSent={(sym, amt) => { closeModal(); showToast(`Sent ${amt} ${sym} · transaction submitted`) }}
        />
      )}
      {modal?.type === 'receive' && (
        <ReceiveModal onClose={closeModal} />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
