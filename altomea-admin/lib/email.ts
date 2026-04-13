import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface WelcomeEmailParams {
  to: string
  clientName: string
  restaurant: string
  city: string
  password: string
}

export async function sendWelcomeEmail({ to, clientName, restaurant, city, password }: WelcomeEmailParams) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[email] SMTP not configured — skipping welcome email')
    return
  }

  const from = process.env.SMTP_FROM ?? `Altomea <contact@altomea.ch>`

  await transporter.sendMail({
    from,
    to,
    cc: 'contact@altomea.ch',
    subject: 'Bienvenue sur votre espace Altomea',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111118;border:1px solid rgba(255,255,255,0.07)">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.07)">
            <p style="margin:0;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#c9a84c;font-weight:600">Altomea</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#e8e8f0">Bienvenue, ${clientName}</h1>
            <p style="margin:0 0 24px;font-size:13px;color:#7a7a8e">${restaurant}${city ? ` — ${city}` : ''}</p>
            <p style="margin:0 0 24px;font-size:14px;color:#e8e8f0;line-height:1.6">
              Votre espace client Altomea a été créé. Vous pouvez dès maintenant vous connecter pour suivre l'avancement de votre projet, consulter vos factures et échanger avec notre équipe.
            </p>
            <!-- Credentials box -->
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
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#c9a84c;padding:12px 28px">
                  <a href="${process.env.NEXTAUTH_URL ?? 'https://admin.altomea.ch'}/login" style="color:#0a0a0f;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none">
                    Accéder à mon espace →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#7a7a8e;line-height:1.6">
              Pour votre sécurité, nous vous recommandons de modifier ce mot de passe dès votre première connexion depuis les paramètres de votre espace.
            </p>
          </td>
        </tr>
        <!-- Footer -->
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
