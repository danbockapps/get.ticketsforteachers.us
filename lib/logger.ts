import {headers} from 'next/headers'

const timestampFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  fractionalSecondDigits: 1,
})

// "2026-06-01 14:23:05.3" in New York time. Pure — safe to call from the proxy,
// which must not depend on request-scoped APIs like next/headers.
export function formatTimestamp(): string {
  return timestampFormat.format(new Date()).replace(', ', ' ')
}

// Client IP from the reverse proxy's forwarded headers. x-forwarded-for can be a
// comma-separated chain; the first entry is the original client.
export function ipFromHeaders(h: Headers): string {
  return h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? 'unknown'
}

// One-line action log: "<ts> [<ip>] [<actor>] <description>". `who` is the
// authenticated user (logs their email) or null for unauthenticated actions
// (logs "anon"). Must be called within a request (server action, route handler,
// or server component) since it reads the forwarded headers.
export async function logAction(
  description: string,
  who?: {email: string} | string | null,
): Promise<void> {
  const ip = ipFromHeaders(await headers())
  const actor = typeof who === 'string' ? who : (who?.email ?? 'anon')
  console.log(`${formatTimestamp()} [${ip}] [${actor}] ${description}`)
}
