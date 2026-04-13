import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret })
  const { pathname } = req.nextUrl

  // Routes publiques — toujours accessibles
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/api/auth') ||
    pathname.match(/^\/factures\/[^/]+\/print/)
  ) {
    return NextResponse.next()
  }

  // Non connecté → login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = token.role as string

  // Redirection depuis la racine selon le rôle
  if (pathname === '/') {
    const dest =
      role === 'admin' ? '/admin/dashboard' :
      role === 'collaborateur' ? '/collaborateur/dashboard' :
      role === 'comptable' ? '/comptable/dashboard' :
      '/client/dashboard'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Protection /admin/*
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Protection /collaborateur/*
  if (pathname.startsWith('/collaborateur') && role !== 'admin' && role !== 'collaborateur') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Protection /comptable/*
  if (pathname.startsWith('/comptable') && role !== 'admin' && role !== 'comptable') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Protection /client/*
  if (pathname.startsWith('/client') && role !== 'client' && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
