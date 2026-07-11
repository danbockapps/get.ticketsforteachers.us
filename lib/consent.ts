import {desc, eq, inArray} from 'drizzle-orm'
import {db} from './db'
import {consentEvents} from './schema'

export type ConsentSource = 'register' | 'preferences' | 'sms_keyword'
export type ConsentMethod = 'web_form' | 'sms_keyword'

// Append one SMS consent event. The consent_events log is append-only — this is
// the only way consent state ever changes. `ipAddress` is the client IP for web
// consent; pass null for sms_keyword events (the request comes from Twilio).
export async function recordConsentEvent(params: {
  userId: string
  event: 'grant' | 'revoke'
  source: ConsentSource
  method: ConsentMethod
  ipAddress?: string | null
}): Promise<void> {
  await db.insert(consentEvents).values({
    userId: params.userId,
    event: params.event,
    source: params.source,
    method: params.method,
    ipAddress: params.ipAddress ?? null,
  })
}

// Current consent = the user's most recent event is a 'grant'. id is
// autoincrement, so highest id = latest event.
export async function hasSmsConsent(userId: string): Promise<boolean> {
  const rows = await db
    .select({event: consentEvents.event})
    .from(consentEvents)
    .where(eq(consentEvents.userId, userId))
    .orderBy(desc(consentEvents.id))
    .limit(1)
  return rows[0]?.event === 'grant'
}

// Of the given users, the subset whose latest event is a 'grant'. One query —
// used by the offer recipient list to resolve consent for many users at once.
export async function smsConsentUserIds(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set()
  const rows = await db
    .select({userId: consentEvents.userId, event: consentEvents.event})
    .from(consentEvents)
    .where(inArray(consentEvents.userId, userIds))
    .orderBy(desc(consentEvents.id))

  const seen = new Set<string>()
  const granted = new Set<string>()
  for (const row of rows) {
    if (seen.has(row.userId)) continue // first row per user (desc id) = latest event
    seen.add(row.userId)
    if (row.event === 'grant') granted.add(row.userId)
  }
  return granted
}
