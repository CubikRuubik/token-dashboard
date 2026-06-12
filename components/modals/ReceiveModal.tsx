'use client'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import Icon from '../ui/Icon'

function FauxQR({ seed }: { seed: string }) {
  const N = 25
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const rnd = (i: number) => { const x = Math.sin(h + i * 12.9898) * 43758.5453; return x - Math.floor(x) }

  const inFinder = (r: number, c: number) => {
    const region = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7
    return region(0, 0) || region(0, N - 7) || region(N - 7, 0)
  }
  const finderOn = (r: number, c: number) => {
    const local = (br: number, bc: number) => {
      const lr = r - br, lc = c - bc
      return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
    }
    if (r < 7 && c < 7) return local(0, 0)
    if (r < 7 && c >= N - 7) return local(0, N - 7)
    if (r >= N - 7 && c < 7) return local(N - 7, 0)
    return false
  }

  const cells: boolean[] = []
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      cells.push(inFinder(r, c) ? finderOn(r, c) : rnd(r * N + c) > 0.52)

  return (
    <div className="qr-box">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, width: '100%', height: '100%' }}>
        {cells.map((on, i) => (
          <div key={i} style={{ background: on ? '#0a0b0d' : 'transparent', borderRadius: 1 }} />
        ))}
      </div>
    </div>
  )
}

export default function ReceiveModal({ onClose }: { onClose: () => void }) {
  const { address } = useAccount()
  const [copied, setCopied] = useState(false)

  function copy() {
    if (address) navigator.clipboard?.writeText(address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Receive</h3>
          <button className="x" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ alignItems: 'stretch' }}>
          <div className="field" style={{ alignItems: 'center' }}>
            {address && <FauxQR seed={address} />}
            <span className="hint" style={{ textAlign: 'center' }}>
              Send only Ethereum assets to this address.
            </span>
          </div>
          <div className="field">
            <label>Your wallet address</label>
            <div className="addr-copy">
              <span className="a">{address ?? '—'}</span>
              <button className="cp" onClick={copy} title="Copy address">
                <Icon name={copied ? 'check' : 'copy'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
