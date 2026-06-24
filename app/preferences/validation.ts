// Returns a message explaining why text-based contact can't be used yet, or
// null when the selection is valid. Shared by the registration and preferences
// forms so the "Create account" / "Save preferences" button can be disabled
// with a clear explanation.
export function smsContactError({
  contactMethod,
  smsConsent,
  hasPhone,
}: {
  contactMethod: string
  smsConsent: boolean
  hasPhone: boolean
}): string | null {
  const wantsSms = contactMethod === 'sms' || contactMethod === 'sms_same_day'
  if (!wantsSms) return null

  if (!hasPhone && !smsConsent) {
    return 'To be contacted by text, add a mobile phone number and check the SMS consent box above.'
  }
  if (!hasPhone) {
    return 'To be contacted by text, add a mobile phone number.'
  }
  if (!smsConsent) {
    return 'To be contacted by text, check the SMS consent box above.'
  }
  return null
}
