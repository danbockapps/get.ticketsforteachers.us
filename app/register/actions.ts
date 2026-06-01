'use server'

import {db} from '@/lib/db'
import {sendMagicLink, sendWorkEmailVerification} from '@/lib/email'
import {sendPhoneVerification} from '@/lib/sms'
import {domains, users} from '@/lib/schema'
import {createMagicLinkToken, generateId} from '@/lib/tokens'
import {eq, or} from 'drizzle-orm'
import {redirect} from 'next/navigation'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

// True when the email's host is the domain itself or a subdomain of it.
function emailInDomain(email: string, domain: string): boolean {
  const host = email.slice(email.lastIndexOf('@') + 1)
  return host === domain || host.endsWith(`.${domain}`)
}

type RegisterFields = {
  firstName: string
  lastName: string
  email: string
  workEmail: string
  phone: string
  eventTypes: string[]
  adaAccessible: boolean
  primaryWorksite: string
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
  const adaAccessible = formData.get('adaAccessible') === 'on'
  const primaryWorksite = (formData.get('primaryWorksite') as string)?.trim() || ''

  const fields: RegisterFields = {
    firstName,
    lastName,
    email,
    workEmail,
    phone: rawPhone,
    eventTypes,
    adaAccessible,
    primaryWorksite,
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
    const digits = normalizePhone(rawPhone)
    if (digits.length < 10) {
      return fail('Please enter a valid mobile phone number.')
    }
    phone = digits.length === 10 ? `+1${digits}` : `+${digits}`
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
    adaAccessible,
    primaryWorksite: primaryWorksite || null,
  })

  const [personalToken, workToken] = await Promise.all([
    createMagicLinkToken(id, 'personal'),
    createMagicLinkToken(id, 'work'),
  ])

  await Promise.all([
    sendMagicLink(email, personalToken),
    sendWorkEmailVerification(workEmail, workToken),
  ])

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
