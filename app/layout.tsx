import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CAPEX Approval System',
  description: 'CAPEX Approval System for managing capital expenditure requests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ backgroundColor: '#0066a1' }}>
          <Navigation />
        </div>
        <main>{children}</main>
      </body>
    </html>
  )
}
