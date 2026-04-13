const RESEND_API = 'https://api.resend.com/emails'
const FROM = 'Altomea <noreply@altomea.ch>'
const CC = 'contact@altomea.ch'

async function send(payload: Record<string, unknown>) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return
  }
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[email] Resend error:', err)
  }
}

// ─── Welcome email (new client account) ───────────────────────────────────────

export interface WelcomeEmailParams {
  to: string
  clientName: string
  restaurant: string
  city: string
  password: string
}

export async function sendWelcomeEmail({ to, clientName, restaurant, city, password }: WelcomeEmailParams) {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? 'https://admin.altomea.ch'}/login`

  await send({
    from: FROM,
    to: [to],
    cc: [CC],
    subject: 'Bienvenue sur votre espace Altomea',
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111118;border:1px solid rgba(255,255,255,0.07)">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.07)">
            <p style="margin:0;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#c9a84c;font-weight:600">Altomea</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#e8e8f0">Bienvenue, ${clientName}</h1>
            <p style="margin:0 0 24px;font-size:13px;color:#7a7a8e">${restaurant}${city ? ` — ${city}` : ''}</p>
            <p style="margin:0 0 24px;font-size:14px;color:#e8e8f0;line-height:1.6">
              Votre espace client Altomea a été créé. Vous pouvez dès maintenant vous connecter pour suivre l'avancement de votre projet, consulter vos factures et échanger avec notre équipe.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7a7a8e">Identifiants de connexion</p>
                  <p style="margin:8px 0 4px;font-size:13px;color:#7a7a8e">Email</p>
                  <p style="margin:0 0 12px;font-size:14px;color:#e8e8f0;font-family:monospace">${to}</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#7a7a8e">Mot de passe temporaire</p>
                  <p style="margin:0;font-size:16px;color:#c9a84c;font-family:monospace;font-weight:600;letter-spacing:1px">${password}</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#c9a84c;padding:12px 28px">
                  <a href="${loginUrl}" style="color:#0a0a0f;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none">Accéder à mon espace →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#7a7a8e;line-height:1.6">
              Pour votre sécurité, nous vous recommandons de modifier ce mot de passe dès votre première connexion.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07)">
            <p style="margin:0;font-size:11px;color:#7a7a8e">© Altomea — contact@altomea.ch</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

// ─── Devis email (send quote to client) ───────────────────────────────────────

export interface DevisEmailParams {
  to: string
  clientName: string
  restaurantName: string
  city: string
  quoteNumber: string
  quoteId: string
  total: number
  validUntil: string
}

export async function sendDevisEmail({
  to,
  clientName,
  restaurantName,
  city,
  quoteNumber,
  quoteId,
  total,
  validUntil,
}: DevisEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://admin.altomea.ch'
  const printUrl = `${baseUrl}/devis/${quoteId}/print`

  const totalFormatted = new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(total)

  const validLabel = validUntil
    ? new Date(validUntil).toLocaleDateString('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  await send({
    from: FROM,
    to: [to],
    cc: [CC],
    reply_to: CC,
    subject: `Votre devis Altomea — ${quoteNumber}`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:560px;width:100%">
        <tr>
          <td style="background:#0a0a0f;padding:28px 40px">
            <span style="font-family:Georgia,serif;font-size:20px;color:#c9a84c;font-weight:700;letter-spacing:4px;text-transform:uppercase">Altomea</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999">Devis</p>
            <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111;font-family:Georgia,serif">${quoteNumber}</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.7">
              Bonjour ${clientName},<br><br>
              Veuillez trouver ci-dessous votre devis pour <strong>${restaurantName}${city ? ` (${city})` : ''}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;margin-bottom:28px">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:160px">Numéro</td>
                <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;font-family:monospace">${quoteNumber}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Total TTC</td>
                <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;font-size:16px;font-weight:700;color:#c9a84c;font-family:monospace">${totalFormatted}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Valide jusqu'au</td>
                <td style="padding:14px 20px;color:#111;font-size:14px">${validLabel}</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#c9a84c;padding:14px 32px">
                  <a href="${printUrl}" style="color:#0a0a0f;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none">Consulter le devis →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#999;line-height:1.7">
              Pour accepter ce devis ou poser une question, répondez directement à cet email ou contactez-nous à <a href="mailto:contact@altomea.ch" style="color:#c9a84c">contact@altomea.ch</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0">
            <p style="margin:0;font-size:11px;color:#bbb">© Altomea — Agence marketing digital pour restaurants · contact@altomea.ch</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
