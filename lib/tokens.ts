import {db} from './db'
import {magicLinkTokens} from './schema'
import {eq, and} from 'drizzle-orm'

const DEFAULT_TTL_SECONDS = 15 * 60 // 15 minutes
const PHONE_TTL_SECONDS = 60 * 60 // 1 hour (user must log in via email first)

function randomBase64url(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Buffer.from(buf).toString('base64url')
}

// 128-bit base64url id for non-enumerable primary keys (e.g. users.id). Random — not
// sequential — so it never leaks user count or signup order, but far shorter than a token.
export function generateId(): string {
  return randomBase64url(16)
}

// Random bearer secret (base64url) for values that appear in URLs/SMS: magic links and
// offer links. Only online guessing is possible, so 128 bits (the default, 22 chars) is
// strong; pass more bytes for long-lived secrets that warrant extra brute-force margin.
export function generateSecret(bytes = 16): string {
  return randomBase64url(bytes)
}

export async function createMagicLinkToken(
  userId: string,
  emailType: 'personal' | 'work' | 'phone' = 'personal',
): Promise<string> {
  const token = generateSecret() // 128-bit; short TTL + one-time use make this ample
  const ttl = emailType === 'phone' ? PHONE_TTL_SECONDS : DEFAULT_TTL_SECONDS
  const expiresAt = Math.floor(Date.now() / 1000) + ttl

  // Invalidate existing tokens of the same type for this user
  await db
    .delete(magicLinkTokens)
    .where(and(eq(magicLinkTokens.userId, userId), eq(magicLinkTokens.emailType, emailType)))

  await db.insert(magicLinkTokens).values({id: token, userId, expiresAt, emailType})

  return token
}

export async function validateMagicLinkToken(
  token: string,
): Promise<{userId: string; emailType: 'personal' | 'work' | 'phone'} | null> {
  const rows = await db.select().from(magicLinkTokens).where(eq(magicLinkTokens.id, token))

  const row = rows[0]
  if (!row) return null

  // Always delete the token (one-time use)
  await db.delete(magicLinkTokens).where(eq(magicLinkTokens.id, token))

  const now = Math.floor(Date.now() / 1000)
  if (row.expiresAt < now) return null

  return {userId: row.userId, emailType: row.emailType as 'personal' | 'work' | 'phone'}
}
