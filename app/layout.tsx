import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter, Cinzel } from 'next/font/google'
import Header from '@/components/Header'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' })

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
        <body className={`${inter.variable} ${cinzel.variable} antialiased min-h-screen font-sans`}>
          <Header />
          <main className="relative z-10">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
