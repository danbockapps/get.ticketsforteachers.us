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
