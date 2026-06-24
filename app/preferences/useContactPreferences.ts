import {useState} from 'react'
import {DEFAULT_CONTACT_METHOD} from './constants'
import {smsContactError} from './validation'

// Owns the contact-method and SMS-consent state for a form and derives the
// validation error from them plus the (parent-owned) phone state. Lets the
// "Create account" / "Save preferences" button stay disabled with a clear
// reason, while PreferenceFields stays presentational.
export function useContactPreferences({
  initialContactMethod = DEFAULT_CONTACT_METHOD,
  initialSmsConsent = false,
  hasPhone,
}: {
  initialContactMethod?: string
  initialSmsConsent?: boolean
  hasPhone: boolean
}) {
  const [contactMethod, setContactMethod] = useState(initialContactMethod)
  const [smsConsent, setSmsConsent] = useState(initialSmsConsent)
  const error = smsContactError({contactMethod, smsConsent, hasPhone})

  return {contactMethod, setContactMethod, smsConsent, setSmsConsent, error}
}
