export function formatEventAt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: process.env.EVENT_TIME_ZONE || 'America/New_York',
    timeZoneName: 'short',
  })
}

export function formatMoney(dollars: number) {
  return `$${dollars.toFixed(2)}`
}

// Format a stored ISO timestamp as a value for <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm"). Uses the runtime's local time so it round-trips exactly
// with `new Date(value)` when the form is submitted (matching createTicket).
export function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatActivityTimestamp(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: process.env.EVENT_TIME_ZONE || 'America/New_York',
  })
}
