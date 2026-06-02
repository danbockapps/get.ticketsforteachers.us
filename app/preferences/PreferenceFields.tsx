import {CONTACT_METHODS, DEFAULT_CONTACT_METHOD, EVENT_TYPES} from './constants'

export default function PreferenceFields({
  preferences = {},
}: {
  preferences?: {eventTypes?: string[]; primaryWorksite?: string; contactMethod?: string}
}) {
  const {
    eventTypes = [],
    primaryWorksite = '',
    contactMethod = DEFAULT_CONTACT_METHOD,
  } = preferences

  return (
    <div className="flex flex-col gap-6">
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
                defaultChecked={contactMethod === value}
                className="radio radio-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
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
