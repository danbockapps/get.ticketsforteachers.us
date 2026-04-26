import {NextRequest, NextResponse} from 'next/server'
import {validateMagicLinkToken} from '@/lib/tokens'
import {lucia} from '@/lib/auth'
import {cookies} from 'next/headers'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }

  const result = await validateMagicLinkToken(token)

  if (!result) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url))
  }

  const session = await lucia.createSession(result.userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  return NextResponse.redirect(new URL('/', request.url))
}
