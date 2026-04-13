import type { Metadata } from 'next'
import { Syne, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', weight: ['400', '500'] })
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-dm-mono', weight: ['400'] })

export const metadata: Metadata = {
  title: 'Altomea Admin',
  description: 'Espace administrateur Altomea',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
