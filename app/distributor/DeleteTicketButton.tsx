'use client'

import {useActionState, useState} from 'react'
import {deleteTicket} from '@/app/distributor/tickets/[id]/actions'

export default function DeleteTicketButton({ticketId}: {ticketId: number}) {
  const [state, action, pending] = useActionState(deleteTicket, null)
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-sm btn-ghost text-error"
      >
        Delete
      </button>
    )
  }

  return (
    <form key={state?.key} action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-sm btn-error">
          {pending ? <span className="loading loading-spinner loading-sm" /> : null}
          Confirm delete?
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="btn btn-sm btn-ghost"
        >
          Cancel
        </button>
      </div>
      {state?.error && <p className="text-error text-xs">{state.error}</p>}
    </form>
  )
}
