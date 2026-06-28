'use client'

import Link from 'next/link'
import {useActionState} from 'react'
import TicketFormFields from '@/app/distributor/tickets/TicketFormFields'
import {createTicket} from './actions'

export default function CreateTicketForm({
  domains,
  defaultDomain,
}: {
  domains: string[]
  defaultDomain?: string
}) {
  const [state, action, pending] = useActionState(createTicket, null)

  return (
    <form key={state?.key} action={action} className="mt-4 flex flex-col gap-4">
      <TicketFormFields domains={domains} defaults={state?.fields ?? {domain: defaultDomain}} />

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
          {pending ? 'Creating…' : 'Create ticket'}
        </button>
      </div>
    </form>
  )
}
