import type { Metadata } from 'next'
import './globals.css'
import { SearchBar } from '@/components/SearchBar'

export const metadata: Metadata = {
  title: 'Dmer-Exp',
  description: 'Created with v0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <div className="min-h-screen flex flex-col">
          <div className="fixed top-4 right-4 z-50">
            <SearchBar />
          </div>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
