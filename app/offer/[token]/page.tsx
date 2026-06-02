import {formatEventAt} from '@/app/admin/format'
import AcceptButton from '@/app/offer/[token]/AcceptButton'
import DeclineButton from '@/app/offer/[token]/DeclineButton'
import {db} from '@/lib/db'
import {ticketOffers, tickets, users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {notFound} from 'next/navigation'

export default async function OfferPage({params}: {params: Promise<{token: string}>}) {
  const {token} = await params

  const offerRows = await db.select().from(ticketOffers).where(eq(ticketOffers.token, token))
  const offer = offerRows[0]
  if (!offer) notFound()

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, offer.ticketId))
  const ticket = ticketRows[0]
  const userRows = await db.select().from(users).where(eq(users.id, offer.userId))
  const recipient = userRows[0]
  if (!ticket || !recipient) notFound()

  const claimedBySelf = ticket.claimedByUserId === recipient.id
  const claimedByOther = ticket.status !== 'unclaimed' && !claimedBySelf
  const declined = offer.declinedAt !== null
  const canAct = ticket.status === 'unclaimed' && !declined

  return (
    <div className="bg-base-200 flex min-h-screen items-start py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h1 className="card-title text-2xl">Hi {recipient.firstName},</h1>

            {claimedBySelf ? (
              <div className="alert alert-success mt-2">
                <span>You claimed this ticket. Watch your inbox — details on the way.</span>
              </div>
            ) : claimedByOther ? (
              <div className="alert alert-warning mt-2">
                <span>This ticket has already been claimed.</span>
              </div>
            ) : declined ? (
              <div className="alert mt-2">
                <span>Thanks — we&apos;ve recorded your decline.</span>
              </div>
            ) : (
              <p className="text-base-content/70 mt-1">
                A free ticket is available — first to accept gets it.
              </p>
            )}

            <div className="divider my-3" />

            <h2 className="text-lg font-semibold">{ticket.description}</h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-base-content/60">When</dt>
              <dd>{formatEventAt(ticket.eventAt)}</dd>
              <dt className="text-base-content/60">Where</dt>
              <dd>{ticket.location}</dd>
              <dt className="text-base-content/60">Quantity</dt>
              <dd>
                {ticket.quantity} {ticket.quantity === 1 ? 'ticket' : 'tickets'}
              </dd>
              <dt className="text-base-content/60">Parking</dt>
              <dd>{ticket.parkingIncluded ? 'Included' : 'Not included'}</dd>
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
            </dl>

            {canAct && (
              <div className="mt-6 flex flex-wrap gap-3">
                <AcceptButton token={token} />
                <DeclineButton token={token} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
