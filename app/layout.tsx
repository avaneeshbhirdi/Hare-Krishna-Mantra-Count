import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import Header from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hare Krishna Japa Counter',
  description: 'A digital Japa counter for Hare Krishna chanting.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen">
          <Header />
          <main className="relative z-10">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
