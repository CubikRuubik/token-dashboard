'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

export const SIGN_MESSAGE = 'Sign in to Token Dashboard'

type AuthState = {
  jwt: string | null
  signing: boolean
  signIn: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ jwt: null, signing: false, signIn: async () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const [jwt, setJwt] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const { signMessageAsync } = useSignMessage()

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
      setJwt(token)
    } catch {
      // user rejected or request failed — jwt stays null
    } finally {
      setSigning(false)
    }
  }, [address, signing, signMessageAsync])

  // Auto sign-in when wallet connects
  useEffect(() => {
    if (isConnected && address && !jwt && !signing) signIn()
  }, [isConnected, address]) // eslint-disable-line

  // Clear JWT on disconnect or address change
  useEffect(() => {
    if (!isConnected) setJwt(null)
  }, [isConnected, address])

  return (
    <AuthContext.Provider value={{ jwt, signing, signIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
