import {db} from './db'
import {magicLinkTokens} from './schema'
import {eq, and} from 'drizzle-orm'

const DEFAULT_TTL_SECONDS = 15 * 60 // 15 minutes
const PHONE_TTL_SECONDS = 60 * 60 // 1 hour (user must log in via email first)

// 256-bit hex token for bearer secrets that appear in URLs/SMS (magic links, offer links).
export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// 128-bit base64url id for non-enumerable primary keys (e.g. users.id). Random — not
// sequential — so it never leaks user count or signup order, but far shorter than a token.
export function generateId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}

export async function createMagicLinkToken(
  userId: string,
  emailType: 'personal' | 'work' | 'phone' = 'personal',
): Promise<string> {
  const token = generateToken()
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
