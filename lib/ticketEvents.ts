import {db} from '@/lib/db'
import {ticketEvents, type TicketStatus} from '@/lib/schema'
import {generateToken} from '@/lib/tokens'

export type EventDetailsByType = {
  created: null
  offered: {method: 'email' | 'sms'}
  accepted: null
  declined: null
  marked_sent: {prior: TicketStatus; next: 'sent'}
  status_changed: {
    prior: TicketStatus
    next: TicketStatus
    priorClaimedByUserId: string | null
    nextClaimedByUserId: string | null
  }
}

export type TicketEventType = keyof EventDetailsByType

export type TicketEventVariant = {
  [K in TicketEventType]: {eventType: K; details: EventDetailsByType[K]}
}[TicketEventType]

type ActorAndTargetByType = {
  created: {actorAdminId: string}
  offered: {actorAdminId: string; targetUserId: string}
  accepted: {actorUserId: string}
  declined: {actorUserId: string}
  marked_sent: {actorAdminId: string}
  status_changed: {actorAdminId: string; targetUserId?: string | null}
}

type DetailsField<K extends TicketEventType> = EventDetailsByType[K] extends null
  ? {details?: never}
  : {details: EventDetailsByType[K]}

export type LogEventInput = {
  [K in TicketEventType]: {ticketId: string; eventType: K} & ActorAndTargetByType[K] &
    DetailsField<K>
}[TicketEventType]

export async function logTicketEvent(input: LogEventInput): Promise<void> {
  const detailsObj = 'details' in input ? input.details : null
  await db.insert(ticketEvents).values({
    id: generateToken(),
    ticketId: input.ticketId,
    actorAdminId: 'actorAdminId' in input ? input.actorAdminId : null,
    actorUserId: 'actorUserId' in input ? input.actorUserId : null,
    targetUserId: 'targetUserId' in input ? (input.targetUserId ?? null) : null,
    eventType: input.eventType,
    details: detailsObj ? JSON.stringify(detailsObj) : null,
  })
}
