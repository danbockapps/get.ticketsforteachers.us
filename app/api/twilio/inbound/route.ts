import {NextRequest, NextResponse} from 'next/server'
import twilio from 'twilio'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {toE164} from '@/lib/contact'
import {logAction} from '@/lib/logger'
import {hasSmsConsent, recordConsentEvent} from '@/lib/consent'

// Twilio's standard opt-out / opt-in keywords. Advanced Opt-Out on the Messaging Service
// sends the auto-replies; we mirror the resulting consent state into users.smsConsentAt.
const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const START_KEYWORDS = new Set(['START', 'UNSTOP', 'YES'])

// Empty TwiML — we let Twilio's Advanced Opt-Out own the auto-reply, so we must not reply again.
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

function inboundUrl(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}/api/twilio/inbound`
}

function twiml() {
  return new NextResponse(EMPTY_TWIML, {status: 200, headers: {'Content-Type': 'text/xml'}})
}

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const params: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') params[key] = value
  }

  const signature = request.headers.get('x-twilio-signature') ?? ''
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN ?? '',
    signature,
    inboundUrl(request),
    params,
  )
  if (!valid) return new NextResponse('Forbidden', {status: 403})

  const from = toE164(params.From ?? '')
  const keyword = (params.Body ?? '').trim().toUpperCase()

  if (!from) return twiml()

  if (STOP_KEYWORDS.has(keyword)) {
    const rows = await db.select({id: users.id}).from(users).where(eq(users.phone, from))
    const userId = rows[0]?.id
    // Record a revoke only if the user currently has consent, to avoid noise
    // from repeated STOP messages.
    if (userId && (await hasSmsConsent(userId))) {
      await recordConsentEvent({userId, event: 'revoke', source: 'sms_keyword', method: 'sms_keyword'})
    }
    await logAction(`sms opt-out from ${from}`)
  } else if (START_KEYWORDS.has(keyword)) {
    // Affirmative re-subscribe. Only re-grant consent for a known, phone-verified
    // user who isn't already consented.
    const rows = await db
      .select({id: users.id, phoneVerified: users.phoneVerified})
      .from(users)
      .where(eq(users.phone, from))
    const dbUser = rows[0]
    if (dbUser?.phoneVerified && !(await hasSmsConsent(dbUser.id))) {
      await recordConsentEvent({
        userId: dbUser.id,
        event: 'grant',
        source: 'sms_keyword',
        method: 'sms_keyword',
      })
    }
    await logAction(`sms opt-in from ${from}`)
  } else {
    await logAction(`sms inbound ${keyword || '(empty)'} from ${from}`)
  }

  return twiml()
}
