'use client'

import Link from 'next/link'
import {useActionState} from 'react'
import {createTicket} from './actions'

export default function CreateTicketForm({
  domains,
  defaultDomain,
}: {
  domains: string[]
  defaultDomain?: string
}) {
  const [state, action, pending] = useActionState(createTicket, null)
  const f = state?.fields

  return (
    <form key={state?.key} action={action} className="mt-4 flex flex-col gap-4">
      {domains.length > 1 ? (
        <div>
          <label className="label" htmlFor="domain">
            <span className="label-text">Domain</span>
          </label>
          <select
            id="domain"
            name="domain"
            required
            defaultValue={f?.domain ?? defaultDomain ?? ''}
            className="select select-bordered w-full"
          >
            <option value="" disabled>
              Select a domain
            </option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="domain" value={domains[0] ?? ''} />
      )}

      <div>
        <label className="label" htmlFor="description">
          <span className="label-text">Description</span>
        </label>
        <input
          id="description"
          name="description"
          type="text"
          required
          defaultValue={f?.description}
          className="input input-bordered w-full"
          placeholder="e.g. Symphony — Brahms No. 4"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="quantity">
            <span className="label-text">Quantity</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={f?.quantity ?? '1'}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="label" htmlFor="eventAt">
            <span className="label-text">Date & time</span>
          </label>
          <input
            id="eventAt"
            name="eventAt"
            type="datetime-local"
            required
            defaultValue={f?.eventAt}
            className="input input-bordered w-full"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="location">
          <span className="label-text">Location</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          defaultValue={f?.location}
          className="input input-bordered w-full"
          placeholder="e.g. Boettcher Concert Hall"
        />
      </div>

      <div>
        <label className="label" htmlFor="marketValue">
          <span className="label-text">Estimated market value (USD)</span>
        </label>
        <input
          id="marketValue"
          name="marketValue"
          type="text"
          inputMode="decimal"
          required
          defaultValue={f?.marketValue}
          className="input input-bordered w-full"
          placeholder="0.00"
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            name="parkingIncluded"
            defaultChecked={f?.parkingIncluded}
            className="checkbox"
          />
          <span className="label-text">Parking included</span>
        </label>
      </div>

      <div className="divider my-0 text-xs">Optional</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="section">
            <span className="label-text">Section</span>
          </label>
          <input
            id="section"
            name="section"
            type="text"
            defaultValue={f?.section}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="label" htmlFor="row">
            <span className="label-text">Row</span>
          </label>
          <input
            id="row"
            name="row"
            type="text"
            defaultValue={f?.row}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="label" htmlFor="seats">
            <span className="label-text">Seat(s)</span>
          </label>
          <input
            id="seats"
            name="seats"
            type="text"
            defaultValue={f?.seats}
            className="input input-bordered w-full"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">
          <span className="label-text">Notes (visible to all users)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={f?.notes}
          className="textarea textarea-bordered w-full"
        />
      </div>

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
