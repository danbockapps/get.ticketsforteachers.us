'use server'

import {requireAdmin} from '@/lib/auth'
import {db} from '@/lib/db'
import {tickets, type TicketStatus, users} from '@/lib/schema'
import {logTicketEvent} from '@/lib/ticketEvents'
import {eq} from 'drizzle-orm'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

export type {TicketStatus}

export type MarkSentState = {error: string; key: number} | null

export async function markSent(_prev: MarkSentState, formData: FormData): Promise<MarkSentState> {
  const ticketId = (formData.get('ticketId') as string) ?? ''
  const {user: admin, domains} = await requireAdmin()
  const fail = (error: string): MarkSentState => ({error, key: Date.now()})

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId))
  const ticket = ticketRows[0]
  if (!ticket) return fail('Ticket not found.')
  if (!domains.includes(ticket.domain)) return fail('You do not have access to this ticket.')
  if (ticket.status === 'sent') return fail('Ticket is already marked sent.')

  const prior = ticket.status
  await db.update(tickets).set({status: 'sent'}).where(eq(tickets.id, ticketId))

  await logTicketEvent({
    ticketId,
    actorAdminId: admin.id,
    eventType: 'marked_sent',
    details: {prior, next: 'sent'},
  })

  revalidatePath('/')
  return null
}

export type ChangeStatusState = {error: string; key: number} | null

export async function changeStatus(
  _prev: ChangeStatusState,
  formData: FormData,
): Promise<ChangeStatusState> {
  const ticketId = (formData.get('ticketId') as string) ?? ''
  const nextStatusRaw = (formData.get('status') as string) ?? ''
  const claimedByUserId = ((formData.get('claimedByUserId') as string) ?? '').trim() || null

  if (nextStatusRaw !== 'unclaimed' && nextStatusRaw !== 'claimed' && nextStatusRaw !== 'sent') {
    return {error: 'Invalid status.', key: Date.now()}
  }
  const nextStatus: TicketStatus = nextStatusRaw

  const {user: admin, domains} = await requireAdmin()
  const fail = (error: string): ChangeStatusState => ({error, key: Date.now()})

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId))
  const ticket = ticketRows[0]
  if (!ticket) return fail('Ticket not found.')
  if (!domains.includes(ticket.domain)) return fail('You do not have access to this ticket.')

  const prior = ticket.status
  if (prior === nextStatus && ticket.claimedByUserId === claimedByUserId) {
    return fail('Status is already set to that value.')
  }

  if (nextStatus === 'claimed' && claimedByUserId) {
    const claimerRows = await db.select().from(users).where(eq(users.id, claimedByUserId))
    const claimer = claimerRows[0]
    if (!claimer) return fail('Selected user not found.')
    if (!claimer.workEmail.toLowerCase().endsWith(`@${ticket.domain.toLowerCase()}`)) {
      return fail('Selected user is not in this ticket’s domain.')
    }
  }

  const nowIso = new Date().toISOString()
  let updateClaimedByUserId: string | null
  let updateClaimedAt: string | null

  if (nextStatus === 'claimed') {
    updateClaimedByUserId = claimedByUserId
    updateClaimedAt = prior === 'claimed' && ticket.claimedAt ? ticket.claimedAt : nowIso
  } else if (nextStatus === 'unclaimed') {
    updateClaimedByUserId = null
    updateClaimedAt = null
  } else {
    // sent — preserve any existing claimer info
    updateClaimedByUserId = ticket.claimedByUserId
    updateClaimedAt = ticket.claimedAt
  }

  await db
    .update(tickets)
    .set({
      status: nextStatus,
      claimedByUserId: updateClaimedByUserId,
      claimedAt: updateClaimedAt,
    })
    .where(eq(tickets.id, ticketId))

  await logTicketEvent({
    ticketId,
    actorAdminId: admin.id,
    eventType: 'status_changed',
    targetUserId: nextStatus === 'claimed' ? claimedByUserId : null,
    details: {
      prior,
      next: nextStatus,
      priorClaimedByUserId: ticket.claimedByUserId,
      nextClaimedByUserId: updateClaimedByUserId,
    },
  })

  revalidatePath('/')
  redirect('/')
}
