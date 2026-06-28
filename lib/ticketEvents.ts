import {db} from '@/lib/db'
import {ticketEvents, type TicketStatus} from '@/lib/schema'

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
  edited: null
  deleted: null
  restored: null
}

export type TicketEventType = keyof EventDetailsByType

export type TicketEventVariant = {
  [K in TicketEventType]: {eventType: K; details: EventDetailsByType[K]}
}[TicketEventType]

type ActorAndTargetByType = {
  created: {actorDistributorId: string}
  offered: {actorDistributorId: string; targetUserId: string}
  accepted: {actorUserId: string}
  declined: {actorUserId: string}
  marked_sent: {actorDistributorId: string}
  status_changed: {actorDistributorId: string; targetUserId?: string | null}
  edited: {actorDistributorId: string}
  deleted: {actorDistributorId: string}
  restored: {actorDistributorId: string}
}

type DetailsField<K extends TicketEventType> = EventDetailsByType[K] extends null
  ? {details?: never}
  : {details: EventDetailsByType[K]}

export type LogEventInput = {
  [K in TicketEventType]: {ticketId: number; eventType: K} & ActorAndTargetByType[K] &
    DetailsField<K>
}[TicketEventType]

export async function logTicketEvent(input: LogEventInput): Promise<void> {
  const detailsObj = 'details' in input ? input.details : null
  await db.insert(ticketEvents).values({
    ticketId: input.ticketId,
    actorDistributorId: 'actorDistributorId' in input ? input.actorDistributorId : null,
    actorUserId: 'actorUserId' in input ? input.actorUserId : null,
    targetUserId: 'targetUserId' in input ? (input.targetUserId ?? null) : null,
    eventType: input.eventType,
    details: detailsObj ? JSON.stringify(detailsObj) : null,
  })
}
