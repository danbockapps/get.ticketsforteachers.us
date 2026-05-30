'use server'

import {db} from '@/lib/db'
import {ticketOffers, tickets} from '@/lib/schema'
import {logTicketEvent} from '@/lib/ticketEvents'
import {and, eq} from 'drizzle-orm'
import {revalidatePath} from 'next/cache'

export type OfferActionState = {error: string; key: number} | null

export async function acceptOffer(
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const token = (formData.get('token') as string) ?? ''
  const fail = (error: string): OfferActionState => ({error, key: Date.now()})

  const offerRows = await db.select().from(ticketOffers).where(eq(ticketOffers.token, token))
  const offer = offerRows[0]
  if (!offer) return fail('This offer link is no longer valid.')

  const now = new Date().toISOString()

  const updated = await db
    .update(tickets)
    .set({status: 'claimed', claimedByUserId: offer.userId, claimedAt: now})
    .where(and(eq(tickets.id, offer.ticketId), eq(tickets.status, 'unclaimed')))
    .returning({id: tickets.id})

  if (updated.length === 0) {
    revalidatePath(`/offer/${token}`)
    return fail('This ticket has already been claimed.')
  }

  await logTicketEvent({
    ticketId: offer.ticketId,
    actorUserId: offer.userId,
    eventType: 'accepted',
  })

  revalidatePath(`/offer/${token}`)
  return null
}

export async function declineOffer(
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const token = (formData.get('token') as string) ?? ''
  const fail = (error: string): OfferActionState => ({error, key: Date.now()})

  const offerRows = await db.select().from(ticketOffers).where(eq(ticketOffers.token, token))
  const offer = offerRows[0]
  if (!offer) return fail('This offer link is no longer valid.')

  await db
    .update(ticketOffers)
    .set({declinedAt: new Date().toISOString()})
    .where(eq(ticketOffers.id, offer.id))

  await logTicketEvent({
    ticketId: offer.ticketId,
    actorUserId: offer.userId,
    eventType: 'declined',
  })

  revalidatePath(`/offer/${token}`)
  return null
}
