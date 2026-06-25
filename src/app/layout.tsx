// src/app/layout.tsx (Full updated version)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar' // Import Navbar
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ShopConnect — Find it nearby',
  description: 'Ask once, compare local offers, and shop nearby with confidence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className}`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen pt-18">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
