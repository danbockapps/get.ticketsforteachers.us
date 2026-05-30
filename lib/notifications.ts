import {Resend} from 'resend'
import twilio from 'twilio'
import type {Ticket, User} from './schema'

const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

function offerUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/offer/${token}`
}

function formatEventAt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: process.env.EVENT_TIME_ZONE || 'America/New_York',
    timeZoneName: 'short',
  })
}

export async function sendOfferSms(user: User, ticket: Ticket, token: string) {
  if (!user.phone) throw new Error('User has no phone number')
  const link = offerUrl(token)
  const when = formatEventAt(ticket.eventAt)
  await twilioClient.messages.create({
    body: `Ticket available — ${ticket.description}, ${when}, ${ticket.location}. First to accept gets it: ${link}`,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to: user.phone,
  })
}

export async function sendOfferEmail(user: User, ticket: Ticket, token: string) {
  const link = offerUrl(token)
  const when = formatEventAt(ticket.eventAt)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    to: user.email,
    subject: `Tickets available: ${ticket.description}`,
    html: `
      <p>Hi ${user.firstName},</p>
      <p>A ticket is available — first to accept gets it.</p>
      <p>
        <strong>${ticket.description}</strong><br>
        ${when}<br>
        ${ticket.location}<br>
        ${ticket.quantity} ${ticket.quantity === 1 ? 'ticket' : 'tickets'}
      </p>
      <p><a href="${link}">Accept or decline</a></p>
    `,
  })
}
