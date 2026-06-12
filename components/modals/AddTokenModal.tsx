'use client'
import { useState } from 'react'
import { isAddress, erc20Abi } from 'viem'
import { useReadContracts, useChainId } from 'wagmi'
import Icon from '../ui/Icon'
import TokenBadge from '../ui/TokenBadge'

export default function AddTokenModal({
  onClose, onAdded,
}: {
  onClose: () => void
  onAdded: (sym: string) => void
}) {
  const [input, setInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const chainId = useChainId()

  const address = isAddress(input.trim()) ? input.trim() as `0x${string}` : undefined
  const dirty = input.trim().length > 0

  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      { address, abi: erc20Abi, functionName: 'name' },
      { address, abi: erc20Abi, functionName: 'symbol' },
      { address, abi: erc20Abi, functionName: 'decimals' },
    ],
    query: { enabled: !!address },
  })

  const name = data?.[0].result as string | undefined
  const symbol = data?.[1].result as string | undefined
  const decimals = data?.[2].result as number | undefined
  const isValidToken = !!name && !!symbol && decimals !== undefined

  async function handleAdd() {
    if (!address || !name || !symbol || decimals === undefined) return
    setIsSaving(true)
    await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, name, symbol, decimals, chainId }),
    })
    setIsSaving(false)
    onAdded(symbol)
  }

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Add token</h3>
          <button className="x" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Token contract address</label>
            <input
              className={`input mono ${dirty && !address ? 'input-err' : ''}`}
              placeholder="0x0000…0000"
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            {dirty && !address && <span className="err-msg">Enter a valid ERC-20 contract address.</span>}
            {!dirty && <span className="hint">Paste the contract address of any ERC-20 token on Sepolia.</span>}
            {isLoading && <span className="hint">Fetching token info...</span>}
            {address && !isLoading && isError && <span className="err-msg">Not a valid ERC-20 contract.</span>}
          </div>

          {isValidToken && address && (
            <div className="tok-preview">
              <TokenBadge symbol={symbol} address={address} size="lg" />
              <div className="pv-main">
                <div className="n">{name} <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>({symbol})</span></div>
                <div className="a">{address.slice(0, 10)}…{address.slice(-8)}</div>
              </div>
              <span className="check"><Icon name="checkCircle" /></span>
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={!isValidToken || isSaving} onClick={handleAdd}>
            <Icon name="plus" /> {isSaving ? 'Saving…' : `Add ${symbol ?? 'token'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
