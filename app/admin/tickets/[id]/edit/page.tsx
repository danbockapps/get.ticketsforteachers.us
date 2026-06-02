import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'
import EditTicketForm from '@/app/admin/tickets/[id]/edit/EditTicketForm'
import {formatEventAt, toDatetimeLocal} from '@/app/admin/format'
import {requireAdmin} from '@/lib/auth'
import {db} from '@/lib/db'
import {tickets} from '@/lib/schema'
import {eq} from 'drizzle-orm'

export default async function EditTicketPage({params}: {params: Promise<{id: string}>}) {
  const {id: idParam} = await params
  const id = Number(idParam)
  const {domains} = await requireAdmin()

  if (!Number.isInteger(id)) notFound()
  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, id))
  const ticket = ticketRows[0]
  if (!ticket) notFound()
  if (!domains.includes(ticket.domain)) redirect('/')
  if (ticket.deletedAt) redirect('/')

  return (
    <div className="bg-base-200 min-h-screen py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4">
        <div>
          <Link href="/" className="text-base-content/60 text-sm hover:underline">
            ← Back to dashboard
          </Link>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h1 className="card-title text-2xl">Edit ticket</h1>
            <p className="text-base-content/70 text-sm">
              {formatEventAt(ticket.eventAt)} · {ticket.location}
            </p>
            <EditTicketForm
              ticketId={ticket.id}
              domain={ticket.domain}
              defaults={{
                domain: ticket.domain,
                description: ticket.description,
                quantity: String(ticket.quantity),
                eventAt: toDatetimeLocal(ticket.eventAt),
                location: ticket.location,
                marketValue: String(ticket.marketValue),
                parkingIncluded: ticket.parkingIncluded,
                highValue: ticket.highValue,
                section: ticket.section ?? '',
                row: ticket.row ?? '',
                seats: ticket.seats ?? '',
                notes: ticket.notes ?? '',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
