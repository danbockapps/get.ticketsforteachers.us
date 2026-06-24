'use client'

import {useActionState} from 'react'
import {savePreferences} from './actions'
import PreferenceFields from './PreferenceFields'

export default function PreferencesForm({
  preferences,
}: {
  preferences: {eventTypes: string[]; contactMethod?: string; smsConsent?: boolean}
}) {
  const [state, action, pending] = useActionState(savePreferences, null)

  return (
    <form action={action} className="flex flex-col gap-3">
      <PreferenceFields preferences={preferences} />

      {state?.success && (
        <div role="alert" className="alert alert-success">
          <span>Preferences saved.</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-2 self-start">
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  )
}
