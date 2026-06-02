import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {ipFromHeaders} from '@/lib/logger'

// Logs one line per incoming request. Kept self-contained per the proxy docs
// (no DB, no request-scoped modules) — just the pure helper. Email is not
// resolved here; descriptive, email-attributed lines come from logAction() in
// the server actions. Timestamps are added by journald, not here.
export function proxy(request: NextRequest) {
  const ip = ipFromHeaders(request.headers)
  console.log(`[${ip}] ${request.method} ${request.nextUrl.pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
