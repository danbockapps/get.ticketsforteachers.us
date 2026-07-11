'use server'

import {db} from '@/lib/db'
import {sendMagicLink, sendWorkEmailVerification} from '@/lib/email'
import {sendPhoneVerification} from '@/lib/sms'
import {domains, users} from '@/lib/schema'
import {createMagicLinkToken, generateId} from '@/lib/tokens'
import {eq, or} from 'drizzle-orm'
import {redirect} from 'next/navigation'
import {ipFromHeaders, logAction} from '@/lib/logger'
import {recordConsentEvent} from '@/lib/consent'
import {emailInDomain, emailRegex, toE164} from '@/lib/contact'
import {headers} from 'next/headers'
import {DEFAULT_CONTACT_METHOD} from '@/app/preferences/constants'

type RegisterFields = {
  firstName: string
  lastName: string
  email: string
  workEmail: string
  phone: string
  eventTypes: string[]
  primaryWorksite: string
  contactMethod: string
  smsConsent: boolean
}

type RegisterState = {error: string; fields: RegisterFields; key: number} | null

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const workEmail = (formData.get('workEmail') as string)?.trim().toLowerCase()
  const domain = (formData.get('domain') as string)?.trim().toLowerCase()
  const rawPhone = (formData.get('phone') as string)?.trim()
  const eventTypes = formData.getAll('eventTypes') as string[]
  const primaryWorksite = (formData.get('primaryWorksite') as string)?.trim() || ''
  const contactMethod = (formData.get('contactMethod') as string) || DEFAULT_CONTACT_METHOD
  const smsConsent =
    formData.get('notificationsConsent') === 'on' && formData.get('offersConsent') === 'on'

  const fields: RegisterFields = {
    firstName,
    lastName,
    email,
    workEmail,
    phone: rawPhone,
    eventTypes,
    primaryWorksite,
    contactMethod,
    smsConsent,
  }

  function fail(error: string): RegisterState {
    return {error, fields, key: Date.now()}
  }

  if (!firstName || !lastName || !email || !workEmail) {
    return fail('All fields are required.')
  }

  if (!emailRegex.test(email)) {
    return fail('Please enter a valid personal email address.')
  }

  if (!emailRegex.test(workEmail)) {
    return fail('Please enter a valid work email address.')
  }

  if (email === workEmail) {
    return fail('Personal and work email addresses must be different.')
  }

  if (!domain) {
    return fail('Registration requires a valid program link from your administrator.')
  }

  const knownDomain = await db.select().from(domains).where(eq(domains.domain, domain))
  if (knownDomain.length === 0) {
    return fail('Registration requires a valid program link from your administrator.')
  }

  if (!emailInDomain(workEmail, domain)) {
    return fail(`Your work email must be a @${domain} address.`)
  }

  // gmail.com is exempt so test accounts can use that domain for both emails.
  if (domain !== 'gmail.com' && emailInDomain(email, domain)) {
    return fail(`Your personal email must not be a @${domain} address.`)
  }

  let phone: string | null = null
  if (rawPhone) {
    phone = toE164(rawPhone)
    if (!phone) {
      return fail('Please enter a valid mobile phone number.')
    }
  }

  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.workEmail, workEmail)))

  for (const row of existing) {
    if (row.email === email) {
      return fail('An account with this personal email already exists.')
    }
    if (row.workEmail === workEmail) {
      return fail('An account with this work email already exists.')
    }
  }

  if (phone) {
    const phoneExists = await db.select().from(users).where(eq(users.phone, phone))
    if (phoneExists.length > 0) {
      return fail('An account with this phone number already exists.')
    }
  }

  const id = generateId()
  await db.insert(users).values({
    id,
    email,
    workEmail,
    phone,
    firstName,
    lastName,
    eventPreferences: JSON.stringify(eventTypes),
    primaryWorksite: primaryWorksite || null,
    contactMethod,
  })

  if (smsConsent) {
    await recordConsentEvent({
      userId: id,
      event: 'grant',
      source: 'register',
      method: 'web_form',
      ipAddress: ipFromHeaders(await headers()),
    })
  }

  const [personalToken, workToken] = await Promise.all([
    createMagicLinkToken(id, 'personal'),
    createMagicLinkToken(id, 'work'),
  ])

  await Promise.all([
    sendMagicLink(email, personalToken),
    sendWorkEmailVerification(workEmail, workToken),
  ])

  await logAction(`registered ${email} for ${domain}`)

  if (phone) {
    try {
      const phoneToken = await createMagicLinkToken(id, 'phone')
      await sendPhoneVerification(phone, phoneToken)
    } catch (err) {
      console.error('SMS verification failed:', err)
      redirect('/check-email?emails=2&smsFailed=1')
    }
  }

  redirect('/check-email?emails=2')
}
