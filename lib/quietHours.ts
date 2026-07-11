import {eq} from 'drizzle-orm'
import {db} from './db'
import {domains} from './schema'

// TCPA quiet hours: SMS may only be sent between 8:00am and 9:00pm in the
// recipient's local time. We use the district's (domain's) time zone as the
// recipient's location — a reasonable, consistent proxy that survives phone
// number portability. See lib/notifications.ts and the offer send action.

const QUIET_HOURS_START = 8 // 8:00am — earliest allowed
const QUIET_HOURS_END = 21 // 9:00pm — first disallowed hour (send blocked from 21:00)

// Returns the current hour (0–23) in the given IANA time zone, or null if the
// zone string is invalid/unrecognized.
export function currentHourInZone(timeZone: string, now: Date = new Date()): number | null {
  try {
    const hour = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(now)
    const parsed = Number(hour)
    return Number.isInteger(parsed) ? parsed % 24 : null
  } catch {
    return null // Invalid time zone identifier
  }
}

// True when the local time in `timeZone` is within the allowed SMS window.
// Returns false for an unknown/invalid zone so callers block by default.
export function isWithinQuietHours(timeZone: string, now: Date = new Date()): boolean {
  const hour = currentHourInZone(timeZone, now)
  if (hour === null) return false
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END
}

export type OfferSmsWindow =
  | {ok: true}
  | {ok: false; reason: 'no_timezone' | 'outside_hours'}

// Resolves a domain's time zone and checks it against the quiet-hours window.
// Shared by the offer action (friendly message) and sendOfferSms (backstop) so
// the lookup-and-block logic lives in exactly one place.
export async function checkOfferSmsWindow(
  domain: string,
  now: Date = new Date(),
): Promise<OfferSmsWindow> {
  const rows = await db.select({timeZone: domains.timeZone}).from(domains).where(eq(domains.domain, domain))
  const timeZone = rows[0]?.timeZone
  if (!timeZone) return {ok: false, reason: 'no_timezone'}
  if (!isWithinQuietHours(timeZone, now)) return {ok: false, reason: 'outside_hours'}
  return {ok: true}
}
