'use server'

import {db} from '@/lib/db'
import {sendMagicLink, sendWorkEmailVerification} from '@/lib/email'
import {users} from '@/lib/schema'
import {createMagicLinkToken, generateToken} from '@/lib/tokens'
import {eq, or} from 'drizzle-orm'
import {redirect} from 'next/navigation'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function register(_prevState: unknown, formData: FormData) {
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const workEmail = (formData.get('workEmail') as string)?.trim().toLowerCase()

  if (!firstName || !lastName || !email || !workEmail) {
    return {error: 'All fields are required.'}
  }

  if (!emailRegex.test(email)) {
    return {error: 'Please enter a valid personal email address.'}
  }

  if (!emailRegex.test(workEmail)) {
    return {error: 'Please enter a valid work email address.'}
  }

  if (email === workEmail) {
    return {error: 'Personal and work email addresses must be different.'}
  }

  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.workEmail, workEmail)))

  for (const row of existing) {
    if (row.email === email) {
      return {error: 'An account with this personal email already exists.'}
    }
    if (row.workEmail === workEmail) {
      return {error: 'An account with this work email already exists.'}
    }
  }

  const eventTypes = formData.getAll('eventTypes') as string[]
  const adaAccessible = formData.get('adaAccessible') === 'on'

  const id = generateToken()
  await db.insert(users).values({
    id,
    email,
    workEmail,
    firstName,
    lastName,
    eventPreferences: JSON.stringify(eventTypes),
    adaAccessible,
  })

  const personalToken = await createMagicLinkToken(id, 'personal')
  const workToken = await createMagicLinkToken(id, 'work')

  await Promise.all([
    sendMagicLink(email, personalToken),
    sendWorkEmailVerification(workEmail, workToken),
  ])

  redirect('/check-email?emails=2')
}
