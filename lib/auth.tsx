'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

export const SIGN_MESSAGE = 'Sign in to Token Dashboard'

const KEY_TOKEN = 'auth_jwt'
const KEY_ADDR = 'auth_addr'

type AuthState = {
  jwt: string | null
  signing: boolean
  signIn: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ jwt: null, signing: false, signIn: async () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, status } = useAccount()
  const [jwt, setJwt] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [signing, setSigning] = useState(false)
  const { signMessageAsync } = useSignMessage()

  // Load persisted token after mount — client-only, avoids SSR/hydration mismatch
  useEffect(() => {
    setJwt(sessionStorage.getItem(KEY_TOKEN))
    setHydrated(true)
  }, [])

  const signIn = useCallback(async () => {
    if (!address || signing) return
    setSigning(true)
    try {
      const signature = await signMessageAsync({ message: SIGN_MESSAGE })
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      })
      if (!res.ok) return
      const { token } = await res.json()
      sessionStorage.setItem(KEY_TOKEN, token)
      sessionStorage.setItem(KEY_ADDR, address.toLowerCase())
      setJwt(token)
    } catch {
      // user rejected or request failed — jwt stays null
    } finally {
      setSigning(false)
    }
  }, [address, signing, signMessageAsync])

  // Clear token only on a definitive disconnect.
  // NOT during 'reconnecting'/'connecting' — that's the page-refresh window
  // where the wallet is being restored and the stored token must survive.
  useEffect(() => {
    if (!hydrated) return
    if (status === 'disconnected') {
      sessionStorage.removeItem(KEY_TOKEN)
      sessionStorage.removeItem(KEY_ADDR)
      setJwt(null)
    }
  }, [status, hydrated])

  // If the connected wallet differs from the token's address (account switch),
  // drop the stale token so auto sign-in re-issues one for the new address.
  useEffect(() => {
    if (!hydrated || !address) return
    const tokenAddr = sessionStorage.getItem(KEY_ADDR)
    if (tokenAddr && tokenAddr !== address.toLowerCase()) {
      sessionStorage.removeItem(KEY_TOKEN)
      sessionStorage.removeItem(KEY_ADDR)
      setJwt(null)
    }
  }, [address, hydrated])

  // Auto sign-in once the wallet is connected and settled, if we have no token
  useEffect(() => {
    if (!hydrated) return
    if (status === 'connected' && address && !jwt && !signing) signIn()
  }, [status, address, jwt, hydrated]) // eslint-disable-line

  return (
    <AuthContext.Provider value={{ jwt, signing, signIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
