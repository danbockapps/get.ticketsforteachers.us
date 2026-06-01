import {NextRequest, NextResponse} from 'next/server'
import {validateMagicLinkToken} from '@/lib/tokens'
import {lucia} from '@/lib/auth'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {cookies} from 'next/headers'
import {logAction} from '@/lib/logger'

function baseUrl(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const base = baseUrl(request)

  if (!token) {
    return NextResponse.redirect(new URL('/verified?error=invalid', base))
  }

  const result = await validateMagicLinkToken(token)

  if (!result) {
    return NextResponse.redirect(new URL('/verified?error=expired', base))
  }

  if (result.emailType === 'work') {
    await db.update(users).set({workEmailVerified: true}).where(eq(users.id, result.userId))
    await logAction(`verified work email for user ${result.userId}`)
    return NextResponse.redirect(new URL('/verified?type=work', base))
  }

  if (result.emailType === 'phone') {
    await db.update(users).set({phoneVerified: true}).where(eq(users.id, result.userId))
    await logAction(`verified phone for user ${result.userId}`)
    return NextResponse.redirect(new URL('/verified?type=phone', base))
  }

  // Personal email link doubles as the sign-in link, so it's used on every login — not
  // just the first time. Only show the confirmation page on first verification; otherwise
  // this is a routine sign-in and the user should land straight on the home page.
  const rows = await db
    .select({emailVerified: users.emailVerified})
    .from(users)
    .where(eq(users.id, result.userId))
  const alreadyVerified = rows[0]?.emailVerified ?? false

  if (!alreadyVerified) {
    await db.update(users).set({emailVerified: true}).where(eq(users.id, result.userId))
  }

  const session = await lucia.createSession(result.userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  await logAction(
    alreadyVerified
      ? `signed in user ${result.userId}`
      : `verified personal email for user ${result.userId}`,
  )

  return NextResponse.redirect(new URL(alreadyVerified ? '/' : '/verified?type=personal', base))
}
