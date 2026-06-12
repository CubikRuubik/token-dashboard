import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'TokenDashboard',
  description: 'View and transfer ERC-20 tokens',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
