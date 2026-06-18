'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

type AuthState = {
  // The wallet we currently hold a valid session cookie for (lowercased), or null.
  authedAddress: string | null
  // True when the session matches the currently connected wallet.
  isAuthed: boolean
  signing: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  authedAddress: null,
  isAuthed: false,
  signing: false,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, status } = useAccount()
  const [authedAddress, setAuthedAddress] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [signing, setSigning] = useState(false)
  const { signMessageAsync } = useSignMessage()

  const isAuthed = !!address && authedAddress === address.toLowerCase()

  // Restore session state on mount — the httpOnly cookie can't be read by JS,
  // so we ask the server who we are.
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setAuthedAddress(d.address ?? null))
      .catch(() => {})
      .finally(() => setHydrated(true))
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setAuthedAddress(null)
  }, [])

  const signIn = useCallback(async () => {
    if (!address || signing) return
    setSigning(true)
    try {
      // 1. Fetch a single-use nonce + the exact message to sign.
      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`)
      if (!nonceRes.ok) return
      const { message } = await nonceRes.json()

      // 2. Sign it with the wallet.
      const signature = await signMessageAsync({ message })

      // 3. Verify — the BFF sets the httpOnly session cookie on success.
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      })
      if (!res.ok) return
      const { address: authed } = await res.json()
      setAuthedAddress((authed ?? address).toLowerCase())
    } catch {
      // user rejected or request failed — stay unauthenticated
    } finally {
      setSigning(false)
    }
  }, [address, signing, signMessageAsync])

  // Clear the session on a definitive disconnect (not during reconnecting).
  useEffect(() => {
    if (!hydrated) return
    if (status === 'disconnected' && authedAddress) signOut()
  }, [status, hydrated]) // eslint-disable-line

  // On account switch, drop the stale session so auto sign-in re-issues one.
  useEffect(() => {
    if (!hydrated || !address || !authedAddress) return
    if (authedAddress !== address.toLowerCase()) signOut()
  }, [address, hydrated]) // eslint-disable-line

  // Auto sign-in once the wallet is connected and settled, if not yet authed.
  useEffect(() => {
    if (!hydrated) return
    if (status === 'connected' && address && !isAuthed && !signing) signIn()
  }, [status, address, isAuthed, hydrated]) // eslint-disable-line

  return (
    <AuthContext.Provider value={{ authedAddress, isAuthed, signing, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
