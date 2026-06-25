'use server'

import {redirect} from 'next/navigation'
import {cookies} from 'next/headers'
import {lucia} from '@/lib/auth'
import {logAction} from '@/lib/logger'

export async function devLogin(formData: FormData) {
  if (process.env.NODE_ENV !== 'development') return

  const userId = formData.get('userId') as string
  if (!userId) return

  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  await logAction(`dev login as user ${userId}`)

  redirect('/')
}
