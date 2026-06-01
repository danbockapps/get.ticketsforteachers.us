'use server'

import {redirect} from 'next/navigation'
import {lucia} from '@/lib/auth'
import {cookies} from 'next/headers'
import {logAction} from '@/lib/logger'

export async function logout() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  if (sessionId) {
    await lucia.invalidateSession(sessionId)
    const blankCookie = lucia.createBlankSessionCookie()
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes)
  }

  await logAction('logged out')

  redirect('/login')
}
