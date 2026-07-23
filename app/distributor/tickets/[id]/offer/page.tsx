import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'
import UserOfferRow from '@/app/distributor/tickets/[id]/offer/UserOfferRow'
import {computeCooldownMap} from '@/app/distributor/tickets/[id]/offer/cooldown'
import {formatEventAt} from '@/app/distributor/format'
import {requireDistributor} from '@/lib/auth'
import {db} from '@/lib/db'
import {resolveOfferMethod} from '@/lib/offerMethod'
import {ticketOffers, tickets, users} from '@/lib/schema'
import {smsConsentUserIds} from '@/lib/consent'
import {and, desc, eq} from 'drizzle-orm'

export default async function OfferTicketPage({params}: {params: Promise<{id: string}>}) {
  const {id: idParam} = await params
  const id = Number(idParam)
  const {domains} = await requireDistributor()

  if (!Number.isInteger(id)) notFound()
  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, id))
  const ticket = ticketRows[0]
  if (!ticket) notFound()
  if (!domains.includes(ticket.domain)) redirect('/')

  const offerableUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      emailVerified: users.emailVerified,
      phone: users.phone,
      phoneVerified: users.phoneVerified,
      contactMethod: users.contactMethod,
      eventPreferences: users.eventPreferences,
      primaryWorksite: users.primaryWorksite,
    })
    .from(users)
    .where(and(eq(users.domain, ticket.domain), eq(users.workEmailVerified, true)))

  // Resolve current SMS consent for the whole recipient list in one query.
  const consentedUserIds = await smsConsentUserIds(offerableUsers.map((u) => u.id))

  const allOffers = await db
    .select({userId: ticketOffers.userId, sentAt: ticketOffers.sentAt})
    .from(ticketOffers)
    .where(eq(ticketOffers.ticketId, id))
    .orderBy(desc(ticketOffers.sentAt))

  const lastOfferByUser = new Map<string, string>()
  for (const o of allOffers) {
    if (!lastOfferByUser.has(o.userId)) lastOfferByUser.set(o.userId, o.sentAt)
  }

  const cooldownByUser = computeCooldownMap(lastOfferByUser)

  return (
    <div className="bg-base-200 min-h-screen py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4">
        <div>
          <Link href="/" className="text-base-content/60 text-sm hover:underline">
            ← Back to dashboard
          </Link>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h1 className="card-title text-xl">Offer ticket</h1>
            <p className="text-base-content/70 text-sm">
              <strong>{ticket.description}</strong>
              <br />
              {formatEventAt(ticket.eventAt)} · {ticket.location} · {ticket.quantity}{' '}
              {ticket.quantity === 1 ? 'ticket' : 'tickets'}
            </p>
            <p className="text-base-content/50 mt-2 text-xs">
              Users in <span className="font-mono">@{ticket.domain}</span>
            </p>
            <p className="text-base-content/50 text-xs">
              Each offer is sent by the recipient’s preferred contact method.
            </p>
          </div>
        </div>

        {offerableUsers.length === 0 ? (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center text-center">
              <p className="text-base-content/60">
                No users found in <span className="font-mono">@{ticket.domain}</span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow">
            <ul className="card-body py-0">
              {offerableUsers.map((u) => (
                <UserOfferRow
                  key={u.id}
                  ticketId={ticket.id}
                  user={{...u, smsConsent: consentedUserIds.has(u.id)}}
                  method={resolveOfferMethod(u.contactMethod, ticket.eventAt)}
                  lastOfferAt={lastOfferByUser.get(u.id) ?? null}
                  withinCooldown={cooldownByUser.get(u.id) ?? false}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
