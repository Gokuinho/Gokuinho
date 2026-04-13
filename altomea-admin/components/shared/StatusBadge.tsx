interface StatusBadgeProps {
  status: string
  type?: 'lead' | 'invoice' | 'client' | 'quote'
}

const leadColors: Record<string, { bg: string; text: string; border: string }> = {
  nouveau:   { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  contacté:  { bg: 'rgba(234,179,8,0.12)',   text: '#facc15', border: 'rgba(234,179,8,0.3)'   },
  converti:  { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
  perdu:     { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)'   },
}

const invoiceColors: Record<string, { bg: string; text: string; border: string }> = {
  brouillon: { bg: 'rgba(122,122,142,0.12)', text: '#7a7a8e', border: 'rgba(122,122,142,0.3)' },
  envoyé:    { bg: 'rgba(234,179,8,0.12)',   text: '#facc15', border: 'rgba(234,179,8,0.3)'   },
  payé:      { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
  échu:      { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)'   },
}

const clientColors: Record<string, { bg: string; text: string; border: string }> = {
  nouveau:   { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  en_cours:  { bg: 'rgba(234,179,8,0.12)',   text: '#facc15', border: 'rgba(234,179,8,0.3)'   },
  actif:     { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
  pause:     { bg: 'rgba(122,122,142,0.12)', text: '#7a7a8e', border: 'rgba(122,122,142,0.3)' },
}

const quoteColors: Record<string, { bg: string; text: string; border: string }> = {
  brouillon:           { bg: 'rgba(122,122,142,0.12)', text: '#7a7a8e', border: 'rgba(122,122,142,0.3)' },
  envoyé:              { bg: 'rgba(234,179,8,0.12)',   text: '#facc15', border: 'rgba(234,179,8,0.3)'   },
  accepté:             { bg: 'rgba(201,168,76,0.15)',  text: '#c9a84c', border: 'rgba(201,168,76,0.3)'  },
  refusé:              { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  converti_en_facture: { bg: 'rgba(122,122,142,0.08)', text: '#7a7a8e', border: 'rgba(122,122,142,0.2)' },
}

const fallback = { bg: 'rgba(122,122,142,0.12)', text: '#7a7a8e', border: 'rgba(122,122,142,0.3)' }

export default function StatusBadge({ status, type = 'lead' }: StatusBadgeProps) {
  const map = type === 'invoice' ? invoiceColors : type === 'client' ? clientColors : type === 'quote' ? quoteColors : leadColors
  const colors = map[status] ?? fallback

  return (
    <span
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontFamily: 'DM Mono, monospace',
      }}
      className="text-[10px] px-2 py-0.5 tracking-wider uppercase"
    >
      {status}
    </span>
  )
}
