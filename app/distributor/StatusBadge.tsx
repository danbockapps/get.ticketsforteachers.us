export default function StatusBadge({status}: {status: string}) {
  if (status === 'claimed') return <span className="badge badge-warning badge-lg">Claimed</span>
  if (status === 'unclaimed') return <span className="badge badge-info">Unclaimed</span>
  return <span className="badge badge-ghost badge-sm">Sent</span>
}
