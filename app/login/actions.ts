'use server'

import {redirect} from 'next/navigation'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {createMagicLinkToken} from '@/lib/tokens'
import {sendMagicLink} from '@/lib/email'

export async function login(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    return {error: 'Email is required.'}
  }

  const rows = await db.select().from(users).where(eq(users.email, email))
  const user = rows[0]

  if (!user) {
    return {error: 'No account found with that email address.'}
  }

  const token = await createMagicLinkToken(user.id, 'personal')
  await sendMagicLink(email, token)

  redirect('/check-email')
}
