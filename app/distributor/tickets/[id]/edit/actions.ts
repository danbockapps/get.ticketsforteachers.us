'use server'

import {requireDistributor} from '@/lib/auth'
import {db} from '@/lib/db'
import {tickets} from '@/lib/schema'
import {logTicketEvent} from '@/lib/ticketEvents'
import {logAction} from '@/lib/logger'
import {eq} from 'drizzle-orm'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

type Fields = {
  description: string
  quantity: string
  eventAt: string
  location: string
  parkingIncluded: boolean
  highValue: boolean
  marketValue: string
  section: string
  row: string
  seats: string
  notes: string
  domain: string
}

export type EditTicketState = {error: string; fields: Fields; key: number} | null

export async function editTicket(
  _prevState: EditTicketState,
  formData: FormData,
): Promise<EditTicketState> {
  const {user: distributor, domains} = await requireDistributor()

  const ticketId = Number(formData.get('ticketId'))
  const description = (formData.get('description') as string)?.trim() ?? ''
  const quantityRaw = (formData.get('quantity') as string)?.trim() ?? ''
  const eventAt = (formData.get('eventAt') as string)?.trim() ?? ''
  const location = (formData.get('location') as string)?.trim() ?? ''
  const parkingIncluded = formData.get('parkingIncluded') === 'on'
  const highValue = formData.get('highValue') === 'on'
  const marketValueRaw = (formData.get('marketValue') as string)?.trim() ?? ''
  const section = (formData.get('section') as string)?.trim() ?? ''
  const row = (formData.get('row') as string)?.trim() ?? ''
  const seats = (formData.get('seats') as string)?.trim() ?? ''
  const notes = (formData.get('notes') as string)?.trim() ?? ''
  const domain = (formData.get('domain') as string)?.trim() ?? ''

  const fields: Fields = {
    description,
    quantity: quantityRaw,
    eventAt,
    location,
    parkingIncluded,
    highValue,
    marketValue: marketValueRaw,
    section,
    row,
    seats,
    notes,
    domain,
  }

  function fail(error: string): EditTicketState {
    return {error, fields, key: Date.now()}
  }

  if (!Number.isInteger(ticketId)) return fail('Ticket not found.')
  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId))
  const ticket = ticketRows[0]
  if (!ticket) return fail('Ticket not found.')
  if (!domains.includes(ticket.domain)) return fail('You do not have access to this ticket.')
  if (ticket.deletedAt) return fail('This ticket has been deleted. Restore it before editing.')

  if (!description) return fail('Description is required.')
  if (!eventAt) return fail('Event date & time is required.')
  if (!location) return fail('Location is required.')

  const quantity = Number.parseInt(quantityRaw, 10)
  if (!Number.isInteger(quantity) || quantity < 1) {
    return fail('Quantity must be a whole number of 1 or more.')
  }

  const marketValue = Number.parseFloat(marketValueRaw)
  if (!Number.isFinite(marketValue) || marketValue < 0) {
    return fail('Market value must be a non-negative number.')
  }

  const eventDate = new Date(eventAt)
  if (Number.isNaN(eventDate.getTime())) {
    return fail('Event date & time is invalid.')
  }

  // Only editable fields are updated — status, claim info, createdByDistributorId,
  // createdAt, deletedAt, domain, and id are intentionally left untouched.
  await db
    .update(tickets)
    .set({
      description,
      quantity,
      eventAt: eventDate.toISOString(),
      location,
      parkingIncluded,
      highValue,
      marketValue,
      section: section || null,
      row: row || null,
      seats: seats || null,
      notes: notes || null,
    })
    .where(eq(tickets.id, ticketId))

  await logTicketEvent({
    ticketId,
    actorDistributorId: distributor.id,
    eventType: 'edited',
  })

  await logAction(`edited ticket ${ticketId} (${ticket.domain})`, distributor)

  revalidatePath('/')
  redirect('/')
}
