'use server'

import {OFFER_COOLDOWN_MS} from '@/app/distributor/tickets/[id]/offer/constants'
import {requireDistributor} from '@/lib/auth'
import {db} from '@/lib/db'
import {sendOfferEmail, sendOfferSms} from '@/lib/notifications'
import {ticketOffers, tickets, users} from '@/lib/schema'
import {checkOfferSmsWindow} from '@/lib/quietHours'
import {hasSmsConsent} from '@/lib/consent'
import {logTicketEvent} from '@/lib/ticketEvents'
import {logAction} from '@/lib/logger'
import {resolveOfferMethod} from '@/lib/offerMethod'
import {generateSecret} from '@/lib/tokens'
import {and, desc, eq} from 'drizzle-orm'
import {revalidatePath} from 'next/cache'

export type {OfferMethod} from '@/lib/offerMethod'
export type SendOfferState = {error: string; key: number} | null

export async function sendOffer(
  _prevState: SendOfferState,
  formData: FormData,
): Promise<SendOfferState> {
  const ticketId = Number(formData.get('ticketId'))
  const userId = (formData.get('userId') as string) ?? ''

  const {user: distributor, domains} = await requireDistributor()

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

  // The recipient's own contact preference decides the channel.
  const method = resolveOfferMethod(recipient.contactMethod, ticket.eventAt)

  if (method === 'email') {
    if (!recipient.emailVerified) return fail('User’s personal email is not verified.')
  } else {
    if (!recipient.phone) return fail('User has no phone number.')
    if (!recipient.phoneVerified) return fail('User’s phone is not verified.')
    if (!(await hasSmsConsent(recipient.id))) return fail('User has not consented to SMS messages.')

    // Friendly pre-check for TCPA quiet hours; sendOfferSms enforces the backstop.
    const window = await checkOfferSmsWindow(ticket.domain)
    if (!window.ok) {
      return fail(
        window.reason === 'no_timezone'
          ? 'No time zone is set for this district, so SMS can’t be sent.'
          : 'It’s outside texting hours (8am–9pm) for this district. Try again later.',
      )
    }
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
    actorDistributorId: distributor.id,
    eventType: 'offered',
    targetUserId: userId,
    details: {method},
  })

  await logAction(`offered ticket ${ticketId} to user ${userId} via ${method}`, distributor)

  revalidatePath(`/distributor/tickets/${ticketId}/offer`)
  return null
}
