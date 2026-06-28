import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'
import ChangeStatusForm from '@/app/distributor/tickets/[id]/status/ChangeStatusForm'
import {formatEventAt} from '@/app/distributor/format'
import {requireDistributor} from '@/lib/auth'
import {db} from '@/lib/db'
import {tickets, users} from '@/lib/schema'
import {and, eq, like} from 'drizzle-orm'

export default async function ChangeStatusPage({params}: {params: Promise<{id: string}>}) {
  const {id: idParam} = await params
  const id = Number(idParam)
  const {domains} = await requireDistributor()

  if (!Number.isInteger(id)) notFound()
  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, id))
  const ticket = ticketRows[0]
  if (!ticket) notFound()
  if (!domains.includes(ticket.domain)) redirect('/')

  const candidateUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(and(like(users.workEmail, `%@${ticket.domain}`), eq(users.workEmailVerified, true)))
    .orderBy(users.lastName, users.firstName)

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
            <h1 className="card-title text-xl">Change status</h1>
            <p className="text-base-content/70 text-sm">
              <strong>{ticket.description}</strong>
              <br />
              {formatEventAt(ticket.eventAt)} · {ticket.location} · {ticket.quantity}{' '}
              {ticket.quantity === 1 ? 'ticket' : 'tickets'}
            </p>
            <p className="text-base-content/50 mt-2 text-xs">
              Current status: <span className="font-mono">{ticket.status}</span>
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <ChangeStatusForm
              ticketId={ticket.id}
              currentStatus={ticket.status}
              currentClaimedByUserId={ticket.claimedByUserId}
              users={candidateUsers}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
