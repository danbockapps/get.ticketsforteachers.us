import CollapsibleTicketSection from '@/app/distributor/CollapsibleTicketSection'
import DashboardFilters from '@/app/distributor/DashboardFilters'
import DomainSwitcher from '@/app/distributor/DomainSwitcher'
import {loadActivityByTicket} from '@/app/distributor/loadActivityByTicket'
import TicketSection from '@/app/distributor/TicketSection'
import Logo from '@/app/Logo'
import {logout} from '@/app/logout/actions'
import {db} from '@/lib/db'
import {tickets, users} from '@/lib/schema'
import {and, desc, eq, gte, lte, type SQL} from 'drizzle-orm'
import Link from 'next/link'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// Was the ticket soft-deleted within the last 30 days? Older deletions are
// retained in the DB but no longer surfaced on the dashboard.
function isRecentlyDeleted(deletedAt: string | null): boolean {
  if (!deletedAt) return false
  return Date.now() - new Date(deletedAt).getTime() <= THIRTY_DAYS_MS
}

export default async function DistributorView({
  user,
  domains,
  from,
  to,
  domainFilter,
}: {
  user: {id: string; firstName: string; email: string}
  domains: string[]
  from: string | null
  to: string | null
  domainFilter: string | null
}) {
  const activeDomain = domainFilter && domains.includes(domainFilter) ? domainFilter : domains[0]

  const whereConditions: SQL[] = [eq(tickets.domain, activeDomain)]
  if (from) whereConditions.push(gte(tickets.eventAt, `${from}T00:00:00.000Z`))
  if (to) whereConditions.push(lte(tickets.eventAt, `${to}T23:59:59.999Z`))

  const rows = !activeDomain
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
          highValue: tickets.highValue,
          marketValue: tickets.marketValue,
          section: tickets.section,
          row: tickets.row,
          seats: tickets.seats,
          notes: tickets.notes,
          status: tickets.status,
          claimedByUserId: tickets.claimedByUserId,
          claimedAt: tickets.claimedAt,
          createdByDistributorId: tickets.createdByDistributorId,
          createdAt: tickets.createdAt,
          deletedAt: tickets.deletedAt,
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

  const live = rowsWithEvents.filter((t) => !t.deletedAt)
  const recentlyDeleted = rowsWithEvents.filter((t) => isRecentlyDeleted(t.deletedAt))

  const claimed = live.filter((t) => t.status === 'claimed')
  const unclaimed = live.filter((t) => t.status === 'unclaimed')
  const sent = live.filter((t) => t.status === 'sent')

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4">
        <Logo className="h-auto w-32" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Distributor Dashboard</h1>
              {domains.length > 1 && (
                <DomainSwitcher domains={domains} current={activeDomain} from={from} to={to} />
              )}
            </div>
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
          <Link
            href={`/distributor/tickets/new?domain=${encodeURIComponent(activeDomain)}`}
            className="btn btn-primary"
          >
            Create ticket
          </Link>
        </div>

        <DashboardFilters from={from} to={to} domainFilter={activeDomain} />

        {live.length === 0 && recentlyDeleted.length === 0 ? (
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
            <CollapsibleTicketSection title="Sent" emphasis="muted" ticketsInSection={sent} />
            <CollapsibleTicketSection
              title="Recently deleted"
              emphasis="muted"
              ticketsInSection={recentlyDeleted}
            />
          </>
        )}
      </div>
    </div>
  )
}
