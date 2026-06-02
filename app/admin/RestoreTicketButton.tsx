'use client'

import {useActionState} from 'react'
import {restoreTicket} from '@/app/admin/tickets/[id]/actions'

export default function RestoreTicketButton({ticketId}: {ticketId: number}) {
  const [state, action, pending] = useActionState(restoreTicket, null)

  return (
    <form key={state?.key} action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="ticketId" value={ticketId} />
      <button type="submit" disabled={pending} className="btn btn-sm">
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        Restore
      </button>
      {state?.error && <p className="text-error text-xs">{state.error}</p>}
    </form>
  )
}
