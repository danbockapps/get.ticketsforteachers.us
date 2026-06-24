'use client'

import {useActionState, useState} from 'react'
import {resendWorkEmailVerification, updateWorkEmail} from './actions'

export default function WorkEmailField({
  workEmail,
  verified,
}: {
  workEmail: string
  verified: boolean
}) {
  const [state, action, pending] = useActionState(updateWorkEmail, null)
  const [value, setValue] = useState(workEmail)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base-content/50 text-xs font-medium uppercase tracking-wide">
          Work email
        </p>
        {verified ? (
          <span className="badge badge-success badge-sm">Verified</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="badge badge-warning badge-sm">Unverified</span>
            <form action={resendWorkEmailVerification}>
              <button type="submit" className="btn btn-ghost btn-xs">
                Resend email
              </button>
            </form>
          </div>
        )}
      </div>

      <form action={action} className="flex items-center gap-2">
        <input
          type="email"
          name="workEmail"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <button type="submit" disabled={pending} className="btn btn-sm btn-primary">
          {pending ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
        </button>
      </form>

      <p className="text-base-content/50 text-xs">
        Used only to verify your program eligibility — we won’t email you here.
      </p>

      {state?.error && <p className="text-error text-xs">{state.error}</p>}
      {state?.success && (
        <p className="text-base-content/60 text-xs">
          {state.sent ? 'Saved. Check that inbox for a verification link.' : 'No changes to save.'}
        </p>
      )}
    </div>
  )
}
