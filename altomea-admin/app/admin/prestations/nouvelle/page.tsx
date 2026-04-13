import ServiceForm from '../ServiceForm'

export default function Page() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p style={{ color: '#c9a84c', fontFamily: 'DM Mono, monospace' }} className="text-xs tracking-[4px] uppercase mb-2">Catalogue</p>
        <h1 style={{ color: '#e8e8f0', fontFamily: 'Syne, sans-serif' }} className="text-2xl font-semibold">Nouvelle prestation</h1>
      </div>
      <ServiceForm />
    </div>
  )
}
