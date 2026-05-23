import {Resend} from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function verifyUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/auth/verify?token=${token}`
}

export async function sendMagicLink(to: string, token: string) {
  const link = verifyUrl(token)

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

export async function sendWorkEmailVerification(to: string, token: string) {
  const link = verifyUrl(token)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    to,
    subject: 'Verify your work email',
    html: `
      <p>Click the link below to verify your work email address. This link expires in 15 minutes.</p>
      <p><a href="${link}">${link}</a></p>
    `,
  })
}
