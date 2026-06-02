import {formatActivityTimestamp} from '@/app/admin/format'
import type {TicketEventVariant} from '@/lib/ticketEvents'

export type ActivityEvent = {
  id: number
  createdAt: string
  actorName: string | null
  targetName: string | null
} & TicketEventVariant

function describeEvent(e: ActivityEvent): string {
  const actor = e.actorName ?? 'someone'
  const target = e.targetName ?? 'a user'
  switch (e.eventType) {
    case 'created':
      return `Created by ${actor}`
    case 'offered':
      return `Offered to ${target} via ${e.details.method === 'sms' ? 'SMS' : e.details.method} by ${actor}`
    case 'accepted':
      return `Accepted by ${actor}`
    case 'declined':
      return `Declined by ${actor}`
    case 'marked_sent':
      return `Marked sent by ${actor}`
    case 'status_changed': {
      const targetClause = e.targetName ? ` (claimer: ${e.targetName})` : ''
      return `Status changed from ${e.details.prior} to ${e.details.next}${targetClause} by ${actor}`
    }
    case 'edited':
      return `Edited by ${actor}`
    case 'deleted':
      return `Deleted by ${actor}`
    case 'restored':
      return `Restored by ${actor}`
  }
}

export default function TicketActivity({events}: {events: ActivityEvent[]}) {
  if (events.length === 0) {
    return <p className="text-base-content/60 mt-1 text-sm italic">No activity yet.</p>
  }
  return (
    <details className="mt-1">
      <summary className="text-base-content/70 cursor-pointer text-sm">
        Show activity ({events.length})
      </summary>
      <ol className="mt-2 space-y-1 text-sm">
        {events.map((e) => (
          <li key={e.id} className="flex gap-2">
            <span className="text-base-content/50 shrink-0 font-mono text-xs">
              {formatActivityTimestamp(e.createdAt)}
            </span>
            <span className="text-base-content/80">{describeEvent(e)}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
