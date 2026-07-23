// The channel an offer goes out on is the user's choice (users.contactMethod),
// not the distributor's. 'sms_same_day' means text only when the event is today;
// anything further out goes by email.

export type OfferMethod = 'email' | 'sms'

function dayInEventZone(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.EVENT_TIME_ZONE || 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function isSameDayEvent(eventAt: string, now: Date = new Date()): boolean {
  return dayInEventZone(eventAt) === dayInEventZone(now.toISOString())
}

export function resolveOfferMethod(
  contactMethod: string,
  eventAt: string,
  now: Date = new Date(),
): OfferMethod {
  if (contactMethod === 'sms') return 'sms'
  if (contactMethod === 'sms_same_day') return isSameDayEvent(eventAt, now) ? 'sms' : 'email'
  return 'email'
}
