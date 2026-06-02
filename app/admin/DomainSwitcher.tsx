'use client'

import {useRouter} from 'next/navigation'

export default function DomainSwitcher({
  domains,
  current,
  from,
  to,
}: {
  domains: string[]
  current: string | null
  from: string | null
  to: string | null
}) {
  const router = useRouter()

  return (
    <select
      aria-label="Domain"
      value={current ?? ''}
      onChange={(e) => {
        // Persist the choice so it survives navigating away and back to a
        // URL without a ?domain= param. Domains are hostnames, so no encoding
        // is needed. One year, scoped to the whole site.
        document.cookie = `adminDomain=${e.target.value}; path=/; max-age=31536000; samesite=lax`
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (e.target.value) params.set('domain', e.target.value)
        const qs = params.toString()
        router.push(qs ? `/?${qs}` : '/')
      }}
      className="select select-bordered select-sm w-auto"
    >
      {domains.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  )
}
