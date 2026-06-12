'use client'
import { useEffect, useState, useRef } from 'react'
import { isAddress, parseUnits, erc20Abi, formatUnits } from 'viem'
import {
  useWriteContract, useWaitForTransactionReceipt, useReadContract,
  useChainId, useAccount, useBalance, useSendTransaction,
} from 'wagmi'
import Icon from '../ui/Icon'
import TokenBadge from '../ui/TokenBadge'
import type { Token } from '@/lib/tokens'

const ETH_TOKEN: Token = { id: -1, symbol: 'ETH', name: 'Ether', address: 'ETH', decimals: 18, chainId: 0 }

function TokenPicker({ tokens, value, onChange }: { tokens: Token[]; value: Token | null; onChange: (t: Token) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (!value) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="token-chip" onClick={() => setOpen(o => !o)}>
        {value.address === 'ETH'
          ? <span className="tok sm" style={{ background: 'radial-gradient(120% 120% at 30% 20%, #627eea, #3a56c4)' }}>ETH</span>
          : <TokenBadge symbol={value.symbol} address={value.address} size="sm" />
        }
        {value.symbol}
        <Icon name="chevron" style={{ width: 14, height: 14, color: 'var(--text-faint)' }} />
      </button>
      {open && (
        <div className="token-picker-dropdown">
          {tokens.map(t => (
            <button key={t.id} type="button" className={`token-picker-item ${t.id === value.id ? 'active' : ''}`}
              onClick={() => { onChange(t); setOpen(false) }}>
              {t.address === 'ETH'
                ? <span className="tok sm" style={{ background: 'radial-gradient(120% 120% at 30% 20%, #627eea, #3a56c4)' }}>ETH</span>
                : <TokenBadge symbol={t.symbol} address={t.address} size="sm" />
              }
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>{t.symbol}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{t.name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SendModal({
  initialTokenId, onClose, onSent,
}: {
  initialTokenId?: number
  onClose: () => void
  onSent: (sym: string, amt: string) => void
}) {
  const chainId = useChainId()
  const { address } = useAccount()
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')

  const isEth = selectedToken?.address === 'ETH'

  useEffect(() => {
    fetch(`/api/tokens?chainId=${chainId}`)
      .then(r => r.json())
      .then((data: Token[]) => {
        const all = [ETH_TOKEN, ...data]
        setTokens(all)
        const initial = initialTokenId ? all.find(t => t.id === initialTokenId) ?? all[0] : all[0]
        setSelectedToken(initial)
      })
  }, [chainId, initialTokenId])

  // ETH balance
  const { data: ethBal } = useBalance({ address, query: { enabled: isEth && !!address } })

  // ERC-20 balance
  const { data: erc20Bal } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !isEth && !!selectedToken && !!address },
  })

  const balanceFormatted = isEth
    ? (ethBal ? Number(formatUnits(ethBal.value, 18)) : 0)
    : (selectedToken && erc20Bal !== undefined ? Number(formatUnits(erc20Bal, selectedToken.decimals)) : 0)

  // ETH send
  const { sendTransaction, data: ethTxHash, isPending: ethPending, error: ethError, reset: ethReset } = useSendTransaction()

  // ERC-20 send
  const { writeContract, data: erc20TxHash, isPending: erc20Pending, error: erc20Error, reset: erc20Reset } = useWriteContract()

  const txHash = isEth ? ethTxHash : erc20TxHash
  const isPending = isEth ? ethPending : erc20Pending
  const error = isEth ? ethError : erc20Error

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (!isSuccess || !selectedToken) return
    onSent(selectedToken.symbol, amount)
  }, [isSuccess]) // eslint-disable-line

  const validTo = isAddress(to.trim())
  const num = parseFloat(amount)
  const validAmt = !isNaN(num) && num > 0 && num <= balanceFormatted
  const over = !isNaN(num) && num > balanceFormatted && balanceFormatted > 0
  const canSend = validTo && validAmt && !!selectedToken && !isPending && !isConfirming

  function handleSend() {
    if (!canSend || !selectedToken) return
    if (isEth) {
      sendTransaction({ to: to as `0x${string}`, value: parseUnits(amount, 18) })
    } else {
      writeContract({
        address: selectedToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseUnits(amount, selectedToken.decimals)],
      })
    }
  }

  function handleTokenChange(t: Token) {
    setSelectedToken(t)
    setAmount('')
    ethReset()
    erc20Reset()
  }

  const label = isPending ? 'Waiting for wallet…' : isConfirming ? 'Confirming…' : `Send ${selectedToken?.symbol ?? ''}`

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Send {selectedToken?.symbol ?? 'token'}</h3>
          <button className="x" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Amount</label>
            <div className="amount-wrap">
              <input className="input mono" placeholder="0.00" inputMode="decimal" value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} autoFocus />
              <div className="amount-suffix">
                <button type="button" className="max-btn"
                  onClick={() => setAmount(balanceFormatted.toString())}>MAX</button>
                <TokenPicker tokens={tokens} value={selectedToken} onChange={handleTokenChange} />
              </div>
            </div>
            <div className="bal-line">
              <span className="l" />
              <span className="v">Balance: {balanceFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} {selectedToken?.symbol}</span>
            </div>
            {over && <span className="err-msg">Amount exceeds your balance.</span>}
          </div>

          <div className="field">
            <label>Recipient address</label>
            <input className={`input mono ${to.trim() && !validTo ? 'input-err' : ''}`}
              placeholder="0x0000…0000" value={to} onChange={e => setTo(e.target.value)} />
            {to.trim() && !validTo && <span className="err-msg">Invalid recipient address.</span>}
          </div>

          <div className="summary-box">
            <div className="bal-line"><span className="l">Network</span><span className="v" style={{ fontFamily: 'var(--font-ui)' }}>Sepolia</span></div>
            <div className="bal-line"><span className="l">Recipient gets</span><span className="v">{validAmt ? num.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '0'} {selectedToken?.symbol}</span></div>
          </div>

          {error && <span className="err-msg">{error.message.split('\n')[0]}</span>}
          {isSuccess && txHash && (
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="tx-link" style={{ justifyContent: 'center' }}>
              View on Etherscan <Icon name="external" />
            </a>
          )}

          <button className="btn btn-primary btn-block" disabled={!canSend} onClick={handleSend}>
            <Icon name="send" /> {label}
          </button>
        </div>
      </div>
    </div>
  )
}
