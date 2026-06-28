import Link from 'next/link'

export default function DashboardFilters({
  from,
  to,
  domainFilter,
}: {
  from: string | null
  to: string | null
  domainFilter: string | null
}) {
  const hasActiveFilter = from || to

  return (
    <form
      method="get"
      action="/"
      className="card bg-base-100 shadow flex-row flex-wrap items-end gap-3 p-3"
    >
      {domainFilter && <input type="hidden" name="domain" value={domainFilter} />}
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

      <button type="submit" className="btn btn-sm btn-primary">
        Apply
      </button>
      {hasActiveFilter && (
        <Link
          href={domainFilter ? `/?domain=${encodeURIComponent(domainFilter)}` : '/'}
          className="btn btn-sm btn-ghost"
        >
          Clear
        </Link>
      )}
    </form>
  )
}
