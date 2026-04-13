'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import React from 'react'

export interface NavItem {
  href: string
  label: string
  icon: string
  badge?: number
}

interface SidebarShellProps {
  role: string
  navItems: NavItem[]
  children?: React.ReactNode
}

export default function SidebarShell({ role, navItems, children }: SidebarShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className="w-60 min-h-screen flex flex-col shrink-0 border-r"
      style={{ background: '#0d0d14', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-8 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-xs tracking-[5px] uppercase font-medium"
          style={{ color: '#c9a84c', fontFamily: 'Syne, sans-serif' }}
        >
          Altomea
        </p>
        <p
          className="text-[10px] tracking-widest uppercase mt-1"
          style={{ color: '#7a7a8e' }}
        >
          {role}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 text-sm transition-colors duration-200"
              style={
                active
                  ? { color: '#c9a84c', background: 'rgba(201,168,76,0.08)' }
                  : { color: '#7a7a8e' }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#e8e8f0'
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#7a7a8e'
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                }
              }}
            >
              <span
                className="text-[11px] shrink-0"
                style={{ color: active ? '#c9a84c' : 'rgba(255,255,255,0.2)' }}
              >
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="flex items-center justify-center rounded-full text-[9px] font-bold w-[18px] h-[18px] ml-auto shrink-0"
                  style={{ background: '#c9a84c', color: '#0a0a0f' }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
        {children}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {session?.user?.email && (
          <p
            className="text-[10px] mb-3 truncate"
            style={{ color: '#7a7a8e', fontFamily: 'DM Mono, monospace' }}
          >
            {session.user.email}
          </p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs tracking-wider uppercase transition-colors duration-200 cursor-pointer hover:text-white/50"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
