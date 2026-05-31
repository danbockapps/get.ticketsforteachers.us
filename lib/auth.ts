import {Lucia} from 'lucia'
import {BetterSqlite3Adapter} from '@lucia-auth/adapter-sqlite'
import {db, sqlite} from './db'
import {domainAdmins} from './schema'
import {eq} from 'drizzle-orm'
import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'

const adapter = new BetterSqlite3Adapter(sqlite, {
  user: 'users',
  session: 'sessions',
})

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    emailVerified: attributes.email_verified,
    workEmail: attributes.work_email,
    workEmailVerified: attributes.work_email_verified,
    firstName: attributes.first_name,
    lastName: attributes.last_name,
    phone: attributes.phone,
    phoneVerified: attributes.phone_verified,
  }),
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

interface DatabaseUserAttributes {
  email: string
  email_verified: boolean
  work_email: string
  work_email_verified: boolean
  first_name: string
  last_name: string
  phone: string | null
  phone_verified: boolean
}

export async function requireAuth() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  if (!sessionId) {
    redirect('/login')
  }

  const {user, session} = await lucia.validateSession(sessionId)

  if (!user) {
    redirect('/login')
  }

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  }

  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const rows = await db
    .select({domain: domainAdmins.domain})
    .from(domainAdmins)
    .where(eq(domainAdmins.userId, user.id))
  if (rows.length === 0) redirect('/')
  return {user, domains: rows.map((r) => r.domain)}
}

export async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  if (!sessionId) return null

  const {user, session} = await lucia.validateSession(sessionId)

  if (!user) return null

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  }

  return user
}
