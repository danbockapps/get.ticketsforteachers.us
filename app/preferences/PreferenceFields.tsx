'use client'

import { CONTACT_METHODS, EVENT_TYPES } from './constants';

export default function PreferenceFields({
  preferences = {},
  contactMethod,
  onContactMethodChange,
  notificationsConsent,
  onNotificationsConsentChange,
  offersConsent,
  onOffersConsentChange,
  error,
}: {
  preferences?: {eventTypes?: string[]; primaryWorksite?: string}
  contactMethod: string
  onContactMethodChange: (value: string) => void
  notificationsConsent: boolean
  onNotificationsConsentChange: (value: boolean) => void
  offersConsent: boolean
  onOffersConsentChange: (value: boolean) => void
  error: string | null
}) {
  const {eventTypes = [], primaryWorksite = ''} = preferences

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="notificationsConsent"
            checked={notificationsConsent}
            onChange={(e) => onNotificationsConsentChange(e.target.checked)}
            className="checkbox checkbox-primary mt-1"
          />
          <span className="text-sm">
            I agree to receive SMS/RCS account updates and notifications from Tickets for Teachers.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="offersConsent"
            checked={offersConsent}
            onChange={(e) => onOffersConsentChange(e.target.checked)}
            className="checkbox checkbox-primary mt-1"
          />
          <span className="text-sm">
            I agree to receive SMS/RCS ticket offers from Tickets for Teachers.
          </span>
        </label>
        <p className="text-sm">
          Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe and
          HELP for help. View our{' '}<a
            href="https://ticketsforteachers.us/PrivacyPolicy.html"
            target="_blank" className='font-medium text-fg-brand underline'>Privacy Policy</a> and{' '}
          <a href="https://ticketsforteachers.us/TermsAndConditions.html"
            target="_blank" className='font-medium text-fg-brand underline'>Terms and Conditions</a>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">What types of events would you like to attend?</h2>
        <div className="flex flex-col gap-2">
          {EVENT_TYPES.map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="eventTypes"
                value={type}
                defaultChecked={eventTypes.includes(type)}
                className="checkbox checkbox-primary"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">When a ticket is available, how should we contact you?</h2>
        <div className="flex flex-col gap-2">
          {CONTACT_METHODS.map(({value, label}) => (
            <label key={value} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="contactMethod"
                value={value}
                checked={contactMethod === value}
                onChange={(e) => onContactMethodChange(e.target.value)}
                className="radio radio-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {error && (
          <div role="alert" className="alert alert-warning">
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold" htmlFor="primaryWorksite">
          Primary worksite/school(s)
        </label>
        <input
          type="text"
          id="primaryWorksite"
          name="primaryWorksite"
          defaultValue={primaryWorksite}
          className="input input-bordered w-full"
        />
      </div>
    </div>
  )
}
