'use server'

import {requireAdmin} from '@/lib/auth'
import {db} from '@/lib/db'
import {tickets} from '@/lib/schema'
import {logTicketEvent} from '@/lib/ticketEvents'
import {logAction} from '@/lib/logger'
import {redirect} from 'next/navigation'

type Fields = {
  description: string
  quantity: string
  eventAt: string
  location: string
  adaAccessible: boolean
  parkingIncluded: boolean
  marketValue: string
  section: string
  row: string
  seats: string
  notes: string
  domain: string
}

export type CreateTicketState = {error: string; fields: Fields; key: number} | null

export async function createTicket(
  _prevState: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const {user, domains} = await requireAdmin()

  const description = (formData.get('description') as string)?.trim() ?? ''
  const quantityRaw = (formData.get('quantity') as string)?.trim() ?? ''
  const eventAt = (formData.get('eventAt') as string)?.trim() ?? ''
  const location = (formData.get('location') as string)?.trim() ?? ''
  const adaAccessible = formData.get('adaAccessible') === 'on'
  const parkingIncluded = formData.get('parkingIncluded') === 'on'
  const marketValueRaw = (formData.get('marketValue') as string)?.trim() ?? ''
  const section = (formData.get('section') as string)?.trim() ?? ''
  const row = (formData.get('row') as string)?.trim() ?? ''
  const seats = (formData.get('seats') as string)?.trim() ?? ''
  const notes = (formData.get('notes') as string)?.trim() ?? ''
  const domain =
    (formData.get('domain') as string)?.trim() ?? (domains.length === 1 ? domains[0] : '')

  const fields: Fields = {
    description,
    quantity: quantityRaw,
    eventAt,
    location,
    adaAccessible,
    parkingIncluded,
    marketValue: marketValueRaw,
    section,
    row,
    seats,
    notes,
    domain,
  }

  function fail(error: string): CreateTicketState {
    return {error, fields, key: Date.now()}
  }

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

  if (!domain) return fail('Domain is required.')
  if (!domains.includes(domain)) return fail('You do not have access to that domain.')

  const [inserted] = await db
    .insert(tickets)
    .values({
      description,
      quantity,
      eventAt: eventDate.toISOString(),
      location,
      adaAccessible,
      parkingIncluded,
      marketValue,
      section: section || null,
      row: row || null,
      seats: seats || null,
      notes: notes || null,
      status: 'unclaimed',
      createdByAdminId: user.id,
      domain,
    })
    .returning({id: tickets.id})
  const ticketId = inserted.id

  await logTicketEvent({
    ticketId,
    actorAdminId: user.id,
    eventType: 'created',
  })

  await logAction(`created ticket ${ticketId} (${domain})`, user)

  redirect('/')
}
