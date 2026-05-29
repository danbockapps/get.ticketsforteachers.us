'use server'

import {OFFER_COOLDOWN_MS} from '@/app/admin/tickets/[id]/offer/constants'
import {requireAdmin} from '@/lib/auth'
import {db} from '@/lib/db'
import {sendOfferEmail} from '@/lib/notifications'
import {ticketEvents, ticketOffers, tickets, users} from '@/lib/schema'
import {generateToken} from '@/lib/tokens'
import {and, desc, eq} from 'drizzle-orm'
import {revalidatePath} from 'next/cache'

export type SendOfferState = {error: string; key: number} | null

export async function sendOffer(
  _prevState: SendOfferState,
  formData: FormData,
): Promise<SendOfferState> {
  const ticketId = (formData.get('ticketId') as string) ?? ''
  const userId = (formData.get('userId') as string) ?? ''

  const {user: admin, domains} = await requireAdmin()

  const fail = (error: string): SendOfferState => ({error, key: Date.now()})

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
  if (!recipient.emailVerified) return fail('User’s personal email is not verified.')

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

  const token = generateToken()
  const offerId = generateToken()
  const eventId = generateToken()
  const now = new Date().toISOString()

  await db.insert(ticketOffers).values({
    id: offerId,
    ticketId,
    userId,
    token,
    method: 'email',
    sentAt: now,
  })

  try {
    await sendOfferEmail(recipient, ticket, token)
  } catch (err) {
    console.error('Failed to send offer email:', err)
    await db.delete(ticketOffers).where(eq(ticketOffers.id, offerId))
    return fail('Failed to send the email. Please try again.')
  }

  await db.insert(ticketEvents).values({
    id: eventId,
    ticketId,
    actorAdminId: admin.id,
    eventType: 'offered',
    targetUserId: userId,
    details: JSON.stringify({method: 'email'}),
  })

  revalidatePath(`/admin/tickets/${ticketId}/offer`)
  return null
}
