// src/app/layout.tsx (Full updated version)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/Navbar' // Import Navbar

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShopConnect',
  description: 'Connects customers with local shops',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar /> {/* Add Navbar here */}
          <main className="pt-20 min-h-screen bg-gray-50"> {/* Add padding for fixed navbar */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}