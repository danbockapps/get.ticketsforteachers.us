'use server'

import {OFFER_COOLDOWN_MS} from '@/app/admin/tickets/[id]/offer/constants'
import {requireAdmin} from '@/lib/auth'
import {db} from '@/lib/db'
import {sendOfferEmail, sendOfferSms} from '@/lib/notifications'
import {ticketOffers, tickets, users} from '@/lib/schema'
import {logTicketEvent} from '@/lib/ticketEvents'
import {generateSecret} from '@/lib/tokens'
import {and, desc, eq} from 'drizzle-orm'
import {revalidatePath} from 'next/cache'

export type OfferMethod = 'email' | 'sms'
export type SendOfferState = {error: string; key: number} | null

export async function sendOffer(
  _prevState: SendOfferState,
  formData: FormData,
): Promise<SendOfferState> {
  const ticketId = Number(formData.get('ticketId'))
  const userId = (formData.get('userId') as string) ?? ''
  const methodRaw = (formData.get('method') as string) ?? 'email'
  if (methodRaw !== 'email' && methodRaw !== 'sms') {
    return {error: 'Invalid method.', key: Date.now()}
  }
  const method: OfferMethod = methodRaw

  const {user: admin, domains} = await requireAdmin()

  const fail = (error: string): SendOfferState => ({error, key: Date.now()})

  if (!Number.isInteger(ticketId)) return fail('Ticket not found.')
  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId))
  const ticket = ticketRows[0]
  if (!ticket) return fail('Ticket not found.')
  if (!domains.includes(ticket.domain)) return fail('You do not have access to this ticket.')

  const userRows = await db.select().from(users).where(eq(users.id, userId))
  const recipient = userRows[0]
  if (!recipient) return fail('User not found.')
  if (!recipient.workEmail.toLowerCase().endsWith(`@${ticket.domain.toLowerCase()}`)) {
    return fail('User is not in this ticket’s domain.')
  }
  if (!recipient.workEmailVerified) return fail('User’s work email is not verified.')

  if (method === 'email') {
    if (!recipient.emailVerified) return fail('User’s personal email is not verified.')
  } else {
    if (!recipient.phone) return fail('User has no phone number.')
    if (!recipient.phoneVerified) return fail('User’s phone is not verified.')
  }

  const lastOffer = await db
    .select()
    .from(ticketOffers)
    .where(and(eq(ticketOffers.ticketId, ticketId), eq(ticketOffers.userId, userId)))
    .orderBy(desc(ticketOffers.sentAt))
    .limit(1)

  if (lastOffer.length > 0) {
    const sentAtMs = new Date(lastOffer[0].sentAt).getTime()
    if (Date.now() - sentAtMs < OFFER_COOLDOWN_MS) {
      return fail('You sent an offer to this user less than 5 minutes ago.')
    }
  }

  const token = generateSecret(20) // 160-bit; offer links live until the ticket is resolved
  const now = new Date().toISOString()

  const [insertedOffer] = await db
    .insert(ticketOffers)
    .values({
      ticketId,
      userId,
      token,
      method,
      sentAt: now,
    })
    .returning({id: ticketOffers.id})
  const offerId = insertedOffer.id

  try {
    if (method === 'email') await sendOfferEmail(recipient, ticket, token)
    else await sendOfferSms(recipient, ticket, token)
  } catch (err) {
    console.error(`Failed to send offer ${method}:`, err)
    await db.delete(ticketOffers).where(eq(ticketOffers.id, offerId))
    return fail(
      `Failed to send the ${method === 'email' ? 'email' : 'text message'}. Please try again.`,
    )
  }

  await logTicketEvent({
    ticketId,
    actorAdminId: admin.id,
    eventType: 'offered',
    targetUserId: userId,
    details: {method},
  })

  revalidatePath(`/admin/tickets/${ticketId}/offer`)
  return null
}
