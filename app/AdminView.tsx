import Link from 'next/link'
import DashboardFilters from '@/app/admin/DashboardFilters'
import {loadActivityByTicket} from '@/app/admin/loadActivityByTicket'
import TicketSection from '@/app/admin/TicketSection'
import {logout} from '@/app/logout/actions'
import {db} from '@/lib/db'
import {tickets, users} from '@/lib/schema'
import {and, desc, eq, gte, inArray, lte, type SQL} from 'drizzle-orm'

export default async function AdminView({
  user,
  domains,
  showSent,
  from,
  to,
  domainFilter,
}: {
  user: {id: string; firstName: string; email: string}
  domains: string[]
  showSent: boolean
  from: string | null
  to: string | null
  domainFilter: string | null
}) {
  const effectiveDomains = domainFilter && domains.includes(domainFilter) ? [domainFilter] : domains

  const whereConditions: SQL[] = [inArray(tickets.domain, effectiveDomains)]
  if (from) whereConditions.push(gte(tickets.eventAt, `${from}T00:00:00.000Z`))
  if (to) whereConditions.push(lte(tickets.eventAt, `${to}T23:59:59.999Z`))

  const rows =
    effectiveDomains.length === 0
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
          .where(and(...whereConditions))
          .orderBy(desc(tickets.eventAt))

  const eventsByTicket = await loadActivityByTicket(rows.map((r) => r.id))
  const rowsWithEvents = rows.map((r) => ({...r, events: eventsByTicket.get(r.id) ?? []}))

  const claimed = rowsWithEvents.filter((t) => t.status === 'claimed')
  const unclaimed = rowsWithEvents.filter((t) => t.status === 'unclaimed')
  const sent = rowsWithEvents.filter((t) => t.status === 'sent')

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
        </div>

        <DashboardFilters
          domains={domains}
          from={from}
          to={to}
          domainFilter={domainFilter}
          showSent={showSent}
        />

        {rows.length === 0 ? (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center text-center">
              <p className="text-base-content/60">No tickets match these filters.</p>
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
