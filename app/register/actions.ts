'use server'

import {redirect} from 'next/navigation'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {createMagicLinkToken} from '@/lib/tokens'
import {sendMagicLink} from '@/lib/email'
import {generateToken} from '@/lib/tokens'

export async function register(_prevState: unknown, formData: FormData) {
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!firstName || !lastName || !email) {
    return {error: 'All fields are required.'}
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {error: 'Please enter a valid email address.'}
  }

  const existing = await db.select().from(users).where(eq(users.email, email))

  if (existing.length > 0) {
    return {error: 'An account with this email already exists.'}
  }

  const id = generateToken()
  await db.insert(users).values({id, email, firstName, lastName})

  const token = await createMagicLinkToken(id)
  await sendMagicLink(email, token)

  redirect('/check-email')
}
