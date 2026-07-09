'use server'

import {revalidatePath} from 'next/cache'
import {db} from '@/lib/db'
import {domains, users} from '@/lib/schema'
import {and, eq, ne} from 'drizzle-orm'
import {requireAuth} from '@/lib/auth'
import {createMagicLinkToken} from '@/lib/tokens'
import {sendPhoneVerification} from '@/lib/sms'
import {sendWorkEmailVerification} from '@/lib/email'
import {emailHost, emailInDomain, emailRegex, toE164} from '@/lib/contact'
import {logAction} from '@/lib/logger'
import {DEFAULT_CONTACT_METHOD} from './constants'

export type ContactFieldState = {
  error?: string
  success?: boolean
  sent?: boolean // a fresh verification link was sent (i.e. the value actually changed)
  key: number
} | null

const ok = (sent = false): ContactFieldState => ({success: true, sent, key: Date.now()})
const err = (error: string): ContactFieldState => ({error, key: Date.now()})

export async function savePreferences(_prevState: unknown, formData: FormData) {
  const user = await requireAuth()
  const selected = formData.getAll('eventTypes') as string[]
  const primaryWorksite = (formData.get('primaryWorksite') as string)?.trim() || null
  const contactMethod = (formData.get('contactMethod') as string) || DEFAULT_CONTACT_METHOD
  const smsConsent =
    formData.get('notificationsConsent') === 'on' && formData.get('offersConsent') === 'on'

  // Record the moment consent flips from false → true; clear it if withdrawn.
  // Preserve the original timestamp while consent stays granted.
  const rows = await db.select().from(users).where(eq(users.id, user.id))
  const existingConsentAt = rows[0]?.smsConsentAt ?? null
  const smsConsentAt = smsConsent ? (existingConsentAt ?? new Date().toISOString()) : null

  await db
    .update(users)
    .set({eventPreferences: JSON.stringify(selected), primaryWorksite, contactMethod, smsConsentAt})
    .where(eq(users.id, user.id))

  await logAction('saved preferences', user)

  revalidatePath('/')
  return {success: true}
}

export async function updatePhone(
  _prevState: ContactFieldState,
  formData: FormData,
): Promise<ContactFieldState> {
  const user = await requireAuth()
  const rawPhone = (formData.get('phone') as string)?.trim() ?? ''

  if (!rawPhone) return err('Please enter a mobile phone number.')
  const phone = toE164(rawPhone)
  if (!phone) return err('Please enter a valid mobile phone number.')

  const rows = await db.select().from(users).where(eq(users.id, user.id))
  const dbUser = rows[0]
  if (!dbUser) return err('Account not found.')

  // No change — nothing to re-verify.
  if (dbUser.phone === phone) return ok()

  const taken = await db
    .select({id: users.id})
    .from(users)
    .where(and(eq(users.phone, phone), ne(users.id, user.id)))
  if (taken.length > 0) return err('An account with this phone number already exists.')

  await db.update(users).set({phone, phoneVerified: false}).where(eq(users.id, user.id))

  const token = await createMagicLinkToken(user.id, 'phone')
  await sendPhoneVerification(phone, token)

  await logAction('updated phone number', user)

  revalidatePath('/')
  return ok(true)
}

export async function updateWorkEmail(
  _prevState: ContactFieldState,
  formData: FormData,
): Promise<ContactFieldState> {
  const user = await requireAuth()
  const workEmail = (formData.get('workEmail') as string)?.trim().toLowerCase() ?? ''

  if (!workEmail) return err('Please enter a work email address.')
  if (!emailRegex.test(workEmail)) return err('Please enter a valid work email address.')

  const rows = await db.select().from(users).where(eq(users.id, user.id))
  const dbUser = rows[0]
  if (!dbUser) return err('Account not found.')

  if (workEmail === dbUser.email) {
    return err('Your work email must be different from your personal email.')
  }

  // No change — nothing to re-verify.
  if (workEmail === dbUser.workEmail) return ok()

  // The work email's host determines which program the user belongs to, so it
  // must be a domain we know about.
  const domain = emailHost(workEmail)
  const knownDomain = await db.select().from(domains).where(eq(domains.domain, domain))
  if (knownDomain.length === 0) {
    return err('That work email isn’t part of a recognized program.')
  }

  // Parity with registration: the personal email must not live in the program
  // domain (gmail.com is exempt so test accounts can reuse it).
  if (domain !== 'gmail.com' && emailInDomain(dbUser.email, domain)) {
    return err(`Your personal email must not be a @${domain} address.`)
  }

  const taken = await db
    .select({id: users.id})
    .from(users)
    .where(and(eq(users.workEmail, workEmail), ne(users.id, user.id)))
  if (taken.length > 0) return err('An account with this work email already exists.')

  await db
    .update(users)
    .set({workEmail, workEmailVerified: false})
    .where(eq(users.id, user.id))

  const token = await createMagicLinkToken(user.id, 'work')
  await sendWorkEmailVerification(workEmail, token)

  await logAction('updated work email', user)

  revalidatePath('/')
  return ok(true)
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

export async function resendWorkEmailVerification(): Promise<void> {
  const user = await requireAuth()

  const rows = await db.select().from(users).where(eq(users.id, user.id))
  const dbUser = rows[0]
  if (!dbUser || dbUser.workEmailVerified) return

  const token = await createMagicLinkToken(user.id, 'work')
  await sendWorkEmailVerification(dbUser.workEmail, token)

  await logAction('resent work email verification', user)

  revalidatePath('/')
}
