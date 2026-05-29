import Link from 'next/link'
import TicketSection from '@/app/admin/TicketSection'
import {logout} from '@/app/logout/actions'
import {db} from '@/lib/db'
import {tickets, users} from '@/lib/schema'
import {desc, eq, inArray} from 'drizzle-orm'

export default async function AdminView({
  user,
  domains,
  showSent,
}: {
  user: {id: string; firstName: string; email: string}
  domains: string[]
  showSent: boolean
}) {
  const rows =
    domains.length === 0
      ? []
      : await db
          .select({
            id: tickets.id,
            description: tickets.description,
            quantity: tickets.quantity,
            eventAt: tickets.eventAt,
            location: tickets.location,
            adaAccessible: tickets.adaAccessible,
            parkingIncluded: tickets.parkingIncluded,
            marketValue: tickets.marketValue,
            section: tickets.section,
            row: tickets.row,
            seats: tickets.seats,
            notes: tickets.notes,
            status: tickets.status,
            claimedByUserId: tickets.claimedByUserId,
            claimedAt: tickets.claimedAt,
            createdByAdminId: tickets.createdByAdminId,
            createdAt: tickets.createdAt,
            domain: tickets.domain,
            claimerFirstName: users.firstName,
            claimerLastName: users.lastName,
          })
          .from(tickets)
          .leftJoin(users, eq(tickets.claimedByUserId, users.id))
          .where(inArray(tickets.domain, domains))
          .orderBy(desc(tickets.eventAt))

  const claimed = rows.filter((t) => t.status === 'claimed')
  const unclaimed = rows.filter((t) => t.status === 'unclaimed')
  const sent = rows.filter((t) => t.status === 'sent')

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin — {user.firstName}</h1>
            <p className="text-base-content/60 text-sm">
              {user.email} · {domains.join(', ') || 'no domains'}
            </p>
          </div>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/admin/tickets/new" className="btn btn-primary">
            Create ticket
          </Link>
          <Link href={showSent ? '/' : '/?showSent=1'} className="btn btn-ghost btn-sm">
            {showSent ? 'Hide sent' : 'Show sent'}
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center text-center">
              <p className="text-base-content/60">No tickets yet.</p>
              <p className="text-base-content/50 text-sm">
                Create one to start offering it to your teachers.
              </p>
            </div>
          </div>
        ) : (
          <>
            <TicketSection
              title="Claimed — send these"
              emphasis="high"
              ticketsInSection={claimed}
            />
            <TicketSection title="Unclaimed" emphasis="normal" ticketsInSection={unclaimed} />
            {showSent && <TicketSection title="Sent" emphasis="muted" ticketsInSection={sent} />}
          </>
        )}
      </div>
    </div>
  )
}
