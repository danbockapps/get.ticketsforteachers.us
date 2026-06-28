import type {ActivityEvent} from '@/app/distributor/TicketActivity'
import {db} from '@/lib/db'
import {ticketEvents, users} from '@/lib/schema'
import {desc, inArray} from 'drizzle-orm'

export async function loadActivityByTicket(
  ticketIds: number[],
): Promise<Map<number, ActivityEvent[]>> {
  if (ticketIds.length === 0) return new Map()

  const eventRows = await db
    .select({
      id: ticketEvents.id,
      ticketId: ticketEvents.ticketId,
      eventType: ticketEvents.eventType,
      createdAt: ticketEvents.createdAt,
      actorUserId: ticketEvents.actorUserId,
      actorDistributorId: ticketEvents.actorDistributorId,
      targetUserId: ticketEvents.targetUserId,
      details: ticketEvents.details,
    })
    .from(ticketEvents)
    .where(inArray(ticketEvents.ticketId, ticketIds))
    .orderBy(desc(ticketEvents.id))

  const involvedUserIds = new Set<string>()
  for (const e of eventRows) {
    if (e.actorUserId) involvedUserIds.add(e.actorUserId)
    if (e.actorDistributorId) involvedUserIds.add(e.actorDistributorId)
    if (e.targetUserId) involvedUserIds.add(e.targetUserId)
  }
  const userRows =
    involvedUserIds.size === 0
      ? []
      : await db
          .select({id: users.id, firstName: users.firstName, lastName: users.lastName})
          .from(users)
          .where(inArray(users.id, [...involvedUserIds]))
  const nameById = new Map(userRows.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

  const eventsByTicket = new Map<number, ActivityEvent[]>()
  for (const e of eventRows) {
    const actorId = e.actorDistributorId ?? e.actorUserId
    const list = eventsByTicket.get(e.ticketId) ?? []
    list.push({
      id: e.id,
      createdAt: e.createdAt,
      actorName: actorId ? (nameById.get(actorId) ?? null) : null,
      targetName: e.targetUserId ? (nameById.get(e.targetUserId) ?? null) : null,
      eventType: e.eventType,
      details: e.details === null ? null : JSON.parse(e.details),
    } as ActivityEvent)
    eventsByTicket.set(e.ticketId, list)
  }

  return eventsByTicket
}
