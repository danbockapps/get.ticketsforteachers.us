import {Resend} from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLink(to: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const link = `${baseUrl}/auth/verify?token=${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    to,
    subject: 'Your sign-in link',
    html: `
      <p>Click the link below to sign in. This link expires in 15 minutes.</p>
      <p><a href="${link}">${link}</a></p>
    `,
  })
}
