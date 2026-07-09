'use client'

import {useActionState} from 'react'
import {savePreferences} from './actions'
import PreferenceFields from './PreferenceFields'
import {useContactPreferences} from './useContactPreferences'

export default function PreferencesForm({
  preferences,
  hasPhone,
}: {
  preferences: {eventTypes: string[]; contactMethod?: string; smsConsent?: boolean}
  hasPhone: boolean
}) {
  const [state, action, pending] = useActionState(savePreferences, null)
  const contact = useContactPreferences({
    initialContactMethod: preferences.contactMethod,
    initialSmsConsent: preferences.smsConsent,
    hasPhone,
  })

  return (
    <form action={action} className="flex flex-col gap-3">
      <PreferenceFields
        preferences={preferences}
        contactMethod={contact.contactMethod}
        onContactMethodChange={contact.setContactMethod}
        notificationsConsent={contact.notificationsConsent}
        onNotificationsConsentChange={contact.setNotificationsConsent}
        offersConsent={contact.offersConsent}
        onOffersConsentChange={contact.setOffersConsent}
        error={contact.error}
      />

      {state?.success && (
        <div role="alert" className="alert alert-success">
          <span>Preferences saved.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || contact.error != null}
        className="btn btn-primary mt-2 self-start"
      >
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  )
}
