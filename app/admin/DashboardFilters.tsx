import Link from 'next/link'

export default function DashboardFilters({
  domains,
  from,
  to,
  domainFilter,
  showSent,
}: {
  domains: string[]
  from: string | null
  to: string | null
  domainFilter: string | null
  showSent: boolean
}) {
  const hasActiveFilter = from || to || domainFilter || showSent

  return (
    <form
      method="get"
      action="/"
      className="card bg-base-100 shadow flex-row flex-wrap items-end gap-3 p-3"
    >
      <label className="form-control">
        <div className="label py-1">
          <span className="label-text text-xs">From</span>
        </div>
        <input
          type="date"
          name="from"
          defaultValue={from ?? ''}
          className="input input-bordered input-sm"
        />
      </label>

      <label className="form-control">
        <div className="label py-1">
          <span className="label-text text-xs">To</span>
        </div>
        <input
          type="date"
          name="to"
          defaultValue={to ?? ''}
          className="input input-bordered input-sm"
        />
      </label>

      {domains.length > 1 && (
        <label className="form-control">
          <div className="label py-1">
            <span className="label-text text-xs">Domain</span>
          </div>
          <select
            name="domain"
            defaultValue={domainFilter ?? ''}
            className="select select-bordered select-sm"
          >
            <option value="">All</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="label cursor-pointer gap-2">
        <input
          type="checkbox"
          name="showSent"
          value="1"
          defaultChecked={showSent}
          className="checkbox checkbox-sm"
        />
        <span className="label-text text-sm">Show sent</span>
      </label>

      <button type="submit" className="btn btn-sm btn-primary">
        Apply
      </button>
      {hasActiveFilter && (
        <Link href="/" className="btn btn-sm btn-ghost">
          Clear
        </Link>
      )}
    </form>
  )
}
