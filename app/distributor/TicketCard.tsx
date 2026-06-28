'use client'

import Link from 'next/link'
import {useState} from 'react'
import DeleteTicketButton from '@/app/distributor/DeleteTicketButton'
import MarkSentButton from '@/app/distributor/MarkSentButton'
import RestoreTicketButton from '@/app/distributor/RestoreTicketButton'
import StatusBadge from '@/app/distributor/StatusBadge'
import TicketActivity, {type ActivityEvent} from '@/app/distributor/TicketActivity'
import {formatEventAt, formatMoney} from '@/app/distributor/format'
import type {tickets} from '@/lib/schema'

export type TicketRow = typeof tickets.$inferSelect & {
  claimerFirstName: string | null
  claimerLastName: string | null
  events: ActivityEvent[]
}

export default function TicketCard({
  ticket,
  emphasis,
}: {
  ticket: TicketRow
  emphasis: 'high' | 'normal' | 'muted'
}) {
  const [open, setOpen] = useState(false)

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
    <div className={cardClass}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="card-body cursor-pointer gap-2 py-4 text-left"
      >
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
          <svg
            className={`text-base-content/50 mt-1 h-5 w-5 flex-none transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-base-300 border-t px-6 py-4">
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-base-content/60">Market value</dt>
              <dd>{formatMoney(ticket.marketValue)}</dd>
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
            <TicketActivity events={ticket.events} />
            <div className="divider my-3" />
            <div className="flex flex-wrap gap-2">
              {ticket.deletedAt ? (
                <RestoreTicketButton ticketId={ticket.id} />
              ) : (
                <>
                  {ticket.status === 'unclaimed' && (
                    <Link href={`/distributor/tickets/${ticket.id}/offer`} className="btn btn-sm btn-primary">
                      Offer
                    </Link>
                  )}
                  {ticket.status === 'claimed' && <MarkSentButton ticketId={ticket.id} />}
                  <Link href={`/distributor/tickets/${ticket.id}/status`} className="btn btn-sm">
                    Change Status
                  </Link>
                  <Link href={`/distributor/tickets/${ticket.id}/edit`} className="btn btn-sm btn-ghost">
                    Edit
                  </Link>
                  <DeleteTicketButton ticketId={ticket.id} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
