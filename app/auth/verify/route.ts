import {NextRequest, NextResponse} from 'next/server'
import {validateMagicLinkToken} from '@/lib/tokens'
import {lucia} from '@/lib/auth'
import {cookies} from 'next/headers'

function baseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
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

  const session = await lucia.createSession(result.userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  return NextResponse.redirect(new URL('/', base))
}
