import StatusBadge from '@/app/admin/StatusBadge'
import {formatEventAt, formatMoney} from '@/app/admin/format'
import type {tickets} from '@/lib/schema'

export type TicketRow = typeof tickets.$inferSelect & {
  claimerFirstName: string | null
  claimerLastName: string | null
}

export default function TicketCard({
  ticket,
  emphasis,
}: {
  ticket: TicketRow
  emphasis: 'high' | 'normal' | 'muted'
}) {
  const claimerName =
    ticket.claimerFirstName && ticket.claimerLastName
      ? `${ticket.claimerFirstName} ${ticket.claimerLastName}`
      : null

  const cardClass =
    emphasis === 'high'
      ? 'card bg-base-100 shadow-md border-2 border-warning'
      : emphasis === 'normal'
        ? 'card bg-base-100 shadow'
        : 'card bg-base-200 shadow-sm opacity-70'

  return (
    <details className={cardClass}>
      <summary className="card-body cursor-pointer list-none gap-2 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              {claimerName && ticket.status === 'claimed' && (
                <span className="text-sm font-medium">→ {claimerName}</span>
              )}
            </div>
            <h3 className="card-title mt-1 text-base">{ticket.description}</h3>
            <p className="text-base-content/70 text-sm">
              {formatEventAt(ticket.eventAt)} · {ticket.location} · {ticket.quantity}{' '}
              {ticket.quantity === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>
        </div>
      </summary>
      <div className="border-base-300 border-t px-6 py-4">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-base-content/60">Market value</dt>
          <dd>{formatMoney(ticket.marketValue)}</dd>
          <dt className="text-base-content/60">ADA accessible</dt>
          <dd>{ticket.adaAccessible ? 'Yes' : 'No'}</dd>
          <dt className="text-base-content/60">Parking included</dt>
          <dd>{ticket.parkingIncluded ? 'Yes' : 'No'}</dd>
          {ticket.section && (
            <>
              <dt className="text-base-content/60">Section</dt>
              <dd>{ticket.section}</dd>
            </>
          )}
          {ticket.row && (
            <>
              <dt className="text-base-content/60">Row</dt>
              <dd>{ticket.row}</dd>
            </>
          )}
          {ticket.seats && (
            <>
              <dt className="text-base-content/60">Seats</dt>
              <dd>{ticket.seats}</dd>
            </>
          )}
          {ticket.notes && (
            <>
              <dt className="text-base-content/60">Notes</dt>
              <dd>{ticket.notes}</dd>
            </>
          )}
          <dt className="text-base-content/60">Domain</dt>
          <dd>{ticket.domain}</dd>
        </dl>
        <div className="divider my-3" />
        <p className="text-base-content/50 text-xs uppercase tracking-wide">Activity</p>
        <p className="text-base-content/60 mt-1 text-sm italic">Audit log coming soon.</p>
        <div className="divider my-3" />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-sm btn-primary" disabled>
            Offer
          </button>
          <button className="btn btn-sm" disabled>
            Mark Sent
          </button>
          <button className="btn btn-sm" disabled>
            Change Status
          </button>
          <button className="btn btn-sm btn-ghost" disabled>
            Edit
          </button>
        </div>
      </div>
    </details>
  )
}
