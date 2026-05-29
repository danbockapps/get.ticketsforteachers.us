import SendOfferButton from '@/app/admin/tickets/[id]/offer/SendOfferButton'

export type OfferableUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  eventPreferences: string | null
  adaAccessible: boolean
  primaryWorksite: string | null
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: process.env.EVENT_TIME_ZONE || 'America/New_York',
  })
}

export default function UserOfferRow({
  ticketId,
  user,
  lastOfferAt,
  withinCooldown,
}: {
  ticketId: string
  user: OfferableUser
  lastOfferAt: string | null
  withinCooldown: boolean
}) {
  const eventTypes: string[] = user.eventPreferences ? JSON.parse(user.eventPreferences) : []

  let disabled = false
  let disabledReason: string | null = null
  if (!user.emailVerified) {
    disabled = true
    disabledReason = 'Personal email not verified'
  } else if (withinCooldown) {
    disabled = true
  }

  return (
    <li
      className="border-base-300 flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-start
        sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-base-content/70 text-sm">{user.email}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {user.adaAccessible && <span className="badge badge-outline badge-sm">ADA</span>}
          {user.primaryWorksite && (
            <span className="badge badge-outline badge-sm">{user.primaryWorksite}</span>
          )}
          {eventTypes.map((t) => (
            <span key={t} className="badge badge-ghost badge-sm">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <SendOfferButton
          ticketId={ticketId}
          userId={user.id}
          disabled={disabled}
          disabledReason={disabledReason}
          hasPriorOffer={lastOfferAt !== null}
        />
        {lastOfferAt && (
          <p className="text-base-content/50 text-xs">
            Last offered {formatTimestamp(lastOfferAt)}
          </p>
        )}
      </div>
    </li>
  )
}
