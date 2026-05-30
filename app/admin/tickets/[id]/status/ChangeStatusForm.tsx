'use client'

import {useActionState, useState} from 'react'
import {changeStatus} from '@/app/admin/tickets/[id]/actions'
import {type TicketStatus} from '@/lib/schema'

export default function ChangeStatusForm({
  ticketId,
  currentStatus,
  currentClaimedByUserId,
  users,
}: {
  ticketId: string
  currentStatus: TicketStatus
  currentClaimedByUserId: string | null
  users: {id: string; firstName: string; lastName: string; email: string}[]
}) {
  const [state, action, pending] = useActionState(changeStatus, null)
  const [status, setStatus] = useState<TicketStatus>(currentStatus)
  const [claimedByUserId, setClaimedByUserId] = useState<string>(currentClaimedByUserId ?? '')

  return (
    <form key={state?.key} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="ticketId" value={ticketId} />

      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">New status</span>
        </div>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus)}
          className="select select-bordered w-full"
        >
          <option value="unclaimed">Unclaimed</option>
          <option value="claimed">Claimed</option>
          <option value="sent">Sent</option>
        </select>
      </label>

      {status === 'claimed' && (
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Claimed by</span>
            <span className="label-text-alt text-base-content/60">optional</span>
          </div>
          <select
            name="claimedByUserId"
            value={claimedByUserId}
            onChange={(e) => setClaimedByUserId(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">— Leave blank —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.lastName}, {u.firstName} ({u.email})
              </option>
            ))}
          </select>
        </label>
      )}

      {state?.error && <p className="text-error text-sm">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <span className="loading loading-spinner loading-sm" /> : null}
          Save
        </button>
      </div>
    </form>
  )
}
