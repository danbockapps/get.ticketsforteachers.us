import {headers} from 'next/headers'

// Client IP from the reverse proxy's forwarded headers. x-forwarded-for can be a
// comma-separated chain; the first entry is the original client.
export function ipFromHeaders(h: Headers): string {
  return h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? 'unknown'
}

// One-line action log: "[<ip>] [<actor>] <description>". `who` is the
// authenticated user (logs their email) or null for unauthenticated actions
// (logs "anon"). Must be called within a request (server action, route handler,
// or server component) since it reads the forwarded headers. The leading
// timestamp is added by journald, so it's omitted here.
export async function logAction(
  description: string,
  who?: {email: string} | string | null,
): Promise<void> {
  const ip = ipFromHeaders(await headers())
  const actor = typeof who === 'string' ? who : (who?.email ?? 'anon')
  console.log(`[${ip}] [${actor}] ${description}`)
}
