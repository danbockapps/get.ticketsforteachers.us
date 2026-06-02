'use client'

import Link from 'next/link'
import {useActionState} from 'react'
import TicketFormFields, {type TicketFieldDefaults} from '@/app/admin/tickets/TicketFormFields'
import {editTicket} from './actions'

export default function EditTicketForm({
  ticketId,
  domain,
  defaults,
}: {
  ticketId: number
  domain: string
  defaults: TicketFieldDefaults
}) {
  const [state, action, pending] = useActionState(editTicket, null)

  return (
    <form key={state?.key} action={action} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      {/* A ticket's domain is fixed; pass a single domain so the field renders hidden. */}
      <TicketFormFields domains={[domain]} defaults={state?.fields ?? defaults} />

      {state?.error && (
        <div role="alert" className="alert alert-error">
          <span>{state.error}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <Link href="/" className="btn btn-ghost">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <span className="loading loading-spinner loading-sm" /> : null}
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
