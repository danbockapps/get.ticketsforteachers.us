'use client'

import {useActionState, useState} from 'react'
import {resendPhoneVerification, updatePhone} from './actions'

export default function PhoneField({
  phone,
  verified,
}: {
  phone: string | null
  verified: boolean
}) {
  const [state, action, pending] = useActionState(updatePhone, null)
  const [value, setValue] = useState(phone ?? '')

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base-content/50 text-xs font-medium uppercase tracking-wide">
          Mobile number
        </p>
        {phone &&
          (verified ? (
            <span className="badge badge-success badge-sm">Verified</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="badge badge-warning badge-sm">Unverified</span>
              <form action={resendPhoneVerification}>
                <button type="submit" className="btn btn-ghost btn-xs">
                  Resend text
                </button>
              </form>
            </div>
          ))}
      </div>

      <form action={action} className="flex items-center gap-2">
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a mobile number"
          className="input input-bordered input-sm w-full"
        />
        <button type="submit" disabled={pending} className="btn btn-sm btn-primary">
          {pending ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
        </button>
      </form>

      {state?.error && <p className="text-error text-xs">{state.error}</p>}
      {state?.success && (
        <p className="text-base-content/60 text-xs">
          {state.sent ? 'Saved. Check your texts for a verification link.' : 'No changes to save.'}
        </p>
      )}
    </div>
  )
}
