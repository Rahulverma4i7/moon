import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Lunar Decider',
  description: 'Align your decisions with the moon cycle.',
  manifest: '/manifest.json',
  themeColor: '#fbbf24',
  generator: 'Rahul',
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%230a0e1a'/%3E%3Cpath d='M20 6a10 10 0 100 20 8 8 0 010-20z' fill='%23fbbf24'/%3E%3C/svg%3E",
        type: 'image/svg+xml',
      },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0e1a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#fbbf24" />
      <body className={`${inter.variable} font-sans antialiased flex min-h-screen flex-col`}>
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
        <Footer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
