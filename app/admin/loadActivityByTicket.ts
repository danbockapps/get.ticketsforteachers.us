import type {ActivityEvent} from '@/app/admin/TicketActivity'
import {db} from '@/lib/db'
import {ticketEvents, users} from '@/lib/schema'
import {desc, inArray} from 'drizzle-orm'

export async function loadActivityByTicket(
  ticketIds: string[],
): Promise<Map<string, ActivityEvent[]>> {
  if (ticketIds.length === 0) return new Map()

  const eventRows = await db
    .select({
      id: ticketEvents.id,
      ticketId: ticketEvents.ticketId,
      eventType: ticketEvents.eventType,
      createdAt: ticketEvents.createdAt,
      actorUserId: ticketEvents.actorUserId,
      actorAdminId: ticketEvents.actorAdminId,
      targetUserId: ticketEvents.targetUserId,
      details: ticketEvents.details,
    })
    .from(ticketEvents)
    .where(inArray(ticketEvents.ticketId, ticketIds))
    .orderBy(desc(ticketEvents.createdAt))

  const involvedUserIds = new Set<string>()
  for (const e of eventRows) {
    if (e.actorUserId) involvedUserIds.add(e.actorUserId)
    if (e.actorAdminId) involvedUserIds.add(e.actorAdminId)
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

  const eventsByTicket = new Map<string, ActivityEvent[]>()
  for (const e of eventRows) {
    const actorId = e.actorAdminId ?? e.actorUserId
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
