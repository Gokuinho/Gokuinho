import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) notFound()

  let items: Array<{ description: string; qty: number; unitPrice: number }> = []
  try { items = JSON.parse(invoice.items) } catch { items = [] }

  const tvaAmount = invoice.subtotal * (invoice.tva / 100)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media print { .no-print { display: none !important; } }
        body { background: white; color: #111; font-family: 'DM Sans', Arial, sans-serif; }
        .page { max-width: 800px; margin: 0 auto; padding: 48px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #c9a84c; }
        .logo { font-family: 'Syne', Georgia, serif; font-size: 26px; font-weight: 700; color: #c9a84c; letter-spacing: 5px; text-transform: uppercase; }
        .agency-info { font-size: 12px; color: #666; line-height: 1.7; text-align: right; }
        .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-bottom: 40px; }
        .meta-group label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; display: block; margin-bottom: 4px; font-family: 'DM Mono', monospace; }
        .meta-group .value { font-size: 14px; color: #111; }
        .meta-group .invoice-number { font-size: 22px; font-weight: 700; color: #c9a84c; font-family: 'DM Mono', monospace; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; border-bottom: 1px solid #e5e5e5; padding: 10px 8px; text-align: left; font-family: 'DM Mono', monospace; }
        tbody tr:last-child td { border-bottom: none; }
        td { padding: 12px 8px; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
        .amount { text-align: right; font-family: 'DM Mono', monospace; }
        .totals { margin-left: auto; width: 260px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #666; }
        .total-row.final { font-size: 17px; font-weight: 700; color: #111; border-top: 2px solid #111; padding-top: 10px; margin-top: 6px; font-family: 'DM Mono', monospace; }
        .footer-text { margin-top: 60px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #bbb; text-align: center; font-family: 'DM Mono', monospace; letter-spacing: 1px; }
        .print-btn { display: block; margin: 32px auto 0; padding: 14px 36px; background: #c9a84c; color: #0a0a0f; border: none; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="logo">Altomea</div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Agence marketing digital — Restaurants</p>
          </div>
          <div className="agency-info">
            <p>contact@altomea.ch</p>
            <p>altomea.ch</p>
            <p>Suisse</p>
          </div>
        </div>

        <div className="meta">
          <div className="meta-group">
            <label>Facture N°</label>
            <span className="invoice-number">{invoice.number}</span>
          </div>
          <div className="meta-group">
            <label>Client</label>
            <div className="value">{invoice.clientName}</div>
            {invoice.clientEmail && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{invoice.clientEmail}</div>}
          </div>
          <div className="meta-group" style={{ textAlign: 'right' }}>
            <label>Date</label>
            <div className="value">{new Date(invoice.createdAt).toLocaleDateString('fr-CH')}</div>
            {invoice.dueDate && (
              <>
                <label style={{ marginTop: 8 }}>Échéance</label>
                <div className="value">{invoice.dueDate}</div>
              </>
            )}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>Qté</th>
              <th className="amount">Prix unit. HT</th>
              <th className="amount">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                <td className="amount">CHF {item.unitPrice.toFixed(2)}</td>
                <td className="amount">CHF {(item.qty * item.unitPrice).toFixed(2)}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{ color: '#999', textAlign: 'center', padding: 20 }}>Aucun article</td></tr>
            )}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-row"><span>Sous-total HT</span><span>CHF {invoice.subtotal.toFixed(2)}</span></div>
          <div className="total-row"><span>TVA ({invoice.tva}%)</span><span>CHF {tvaAmount.toFixed(2)}</span></div>
          <div className="total-row final"><span>Total TTC</span><span>CHF {invoice.total.toFixed(2)}</span></div>
        </div>

        <div className="footer-text">
          Altomea · Agence marketing digital pour restaurants · altomea.ch · contact@altomea.ch
        </div>
      </div>

      <button className="print-btn no-print" id="printBtn">Imprimer / Télécharger PDF</button>
      <script dangerouslySetInnerHTML={{ __html: `document.getElementById('printBtn').onclick=function(){window.print();}` }} />
    </>
  )
}
