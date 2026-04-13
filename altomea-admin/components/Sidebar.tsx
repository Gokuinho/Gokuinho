'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/', label: 'Tableau de bord', icon: '◈' },
  { href: '/leads', label: 'Demandes', icon: '◎' },
  { href: '/factures', label: 'Factures', icon: '◇' },
  { href: '/prompts', label: 'Bibliothèque', icon: '◉' },
  { href: '/workspace', label: 'Espace IA', icon: '▲' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-[#0f0e0c] border-r border-white/[0.06] flex flex-col shrink-0">
      <div className="px-6 py-8 border-b border-white/[0.06]">
        <p className="text-[#d4af75] text-xs tracking-[5px] uppercase font-medium">Altomea</p>
        <p className="text-white/25 text-[10px] tracking-widest uppercase mt-1">Admin</p>
      </div>

      <nav className="flex-1 py-4">
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? 'text-[#d4af75] bg-[#d4af75]/[0.07]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
              }`}
            >
              <span className={`text-[11px] ${active ? 'text-[#d4af75]' : 'text-white/20'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-5 border-t border-white/[0.06]">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-white/25 text-xs tracking-wider uppercase hover:text-white/50 transition-colors cursor-pointer"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
