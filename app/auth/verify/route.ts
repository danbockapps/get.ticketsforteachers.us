import {NextRequest, NextResponse} from 'next/server'
import {validateMagicLinkToken} from '@/lib/tokens'
import {lucia} from '@/lib/auth'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {cookies} from 'next/headers'

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
    return NextResponse.redirect(new URL('/login?error=invalid', base))
  }

  const result = await validateMagicLinkToken(token)

  if (!result) {
    return NextResponse.redirect(new URL('/login?error=expired', base))
  }

  if (result.emailType === 'work') {
    await db.update(users).set({workEmailVerified: true}).where(eq(users.id, result.userId))
    return NextResponse.redirect(new URL('/login?workEmailVerified=true', base))
  }

  // Personal email: mark verified and create session
  await db.update(users).set({emailVerified: true}).where(eq(users.id, result.userId))

  const session = await lucia.createSession(result.userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  return NextResponse.redirect(new URL('/', base))
}
