import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HEALOTAC',
  description: 'Medical Records Management System for Indian Army Cadets',
  keywords: 'healotac, medical records, indian army, cadet health, military healthcare',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
