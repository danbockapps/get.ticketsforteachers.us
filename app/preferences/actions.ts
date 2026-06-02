'use server'

import {revalidatePath} from 'next/cache'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {requireAuth} from '@/lib/auth'
import {createMagicLinkToken} from '@/lib/tokens'
import {sendPhoneVerification} from '@/lib/sms'
import {logAction} from '@/lib/logger'
import {DEFAULT_CONTACT_METHOD} from './constants'

export async function savePreferences(_prevState: unknown, formData: FormData) {
  const user = await requireAuth()
  const selected = formData.getAll('eventTypes') as string[]
  const primaryWorksite = (formData.get('primaryWorksite') as string)?.trim() || null
  const contactMethod = (formData.get('contactMethod') as string) || DEFAULT_CONTACT_METHOD

  await db
    .update(users)
    .set({eventPreferences: JSON.stringify(selected), primaryWorksite, contactMethod})
    .where(eq(users.id, user.id))

  await logAction('saved preferences', user)

  revalidatePath('/')
  return {success: true}
}

export async function resendPhoneVerification(): Promise<void> {
  const user = await requireAuth()

  const rows = await db.select().from(users).where(eq(users.id, user.id))
  const dbUser = rows[0]
  if (!dbUser?.phone || dbUser.phoneVerified) return

  const token = await createMagicLinkToken(user.id, 'phone')
  await sendPhoneVerification(dbUser.phone, token)

  await logAction('resent phone verification', user)

  revalidatePath('/')
}
