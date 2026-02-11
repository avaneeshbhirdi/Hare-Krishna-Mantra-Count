import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter, Cinzel } from 'next/font/google'
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
          <main className="relative z-10 w-full h-screen flex flex-col justify-center items-center">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
