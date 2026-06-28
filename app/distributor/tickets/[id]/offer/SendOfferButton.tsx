'use client'

import {useActionState} from 'react'
import {sendOffer, type OfferMethod} from './actions'

export default function SendOfferButton({
  ticketId,
  userId,
  method,
  disabled,
  disabledReason,
  hasPriorOffer,
}: {
  ticketId: number
  userId: string
  method: OfferMethod
  disabled: boolean
  disabledReason: string | null
  hasPriorOffer: boolean
}) {
  const [state, action, pending] = useActionState(sendOffer, null)

  return (
    <form key={state?.key} action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="method" value={method} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="btn btn-sm btn-primary"
        title={disabledReason ?? undefined}
      >
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {hasPriorOffer ? 'Send again' : 'Send offer'}
      </button>
      {state?.error && <p className="text-error text-xs">{state.error}</p>}
      {disabledReason && !state?.error && (
        <p className="text-base-content/60 text-xs">{disabledReason}</p>
      )}
    </form>
  )
}
