'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0b09]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-[#d4af75] text-xs tracking-[6px] uppercase mb-3">Altomea</p>
          <h1 className="text-2xl font-semibold text-white">Administration</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-widest uppercase text-white/40">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-[#d4af75]/50 transition-colors rounded-none"
              placeholder="admin@altomea.ch"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs tracking-widest uppercase text-white/40">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-[#d4af75]/50 transition-colors rounded-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400/80 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#d4af75] text-[#0c0b09] text-xs tracking-[3px] uppercase font-semibold py-4 cursor-pointer hover:bg-[#c49a60] transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
