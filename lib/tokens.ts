import {db} from './db'
import {magicLinkTokens} from './schema'
import {eq} from 'drizzle-orm'

const TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes

export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createMagicLinkToken(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS

  // Invalidate any existing tokens for this user
  await db.delete(magicLinkTokens).where(eq(magicLinkTokens.userId, userId))

  await db.insert(magicLinkTokens).values({id: token, userId, expiresAt})

  return token
}

export async function validateMagicLinkToken(
  token: string,
): Promise<{userId: string} | null> {
  const rows = await db
    .select()
    .from(magicLinkTokens)
    .where(eq(magicLinkTokens.id, token))

  const row = rows[0]
  if (!row) return null

  // Always delete the token (one-time use)
  await db.delete(magicLinkTokens).where(eq(magicLinkTokens.id, token))

  const now = Math.floor(Date.now() / 1000)
  if (row.expiresAt < now) return null

  return {userId: row.userId}
}
