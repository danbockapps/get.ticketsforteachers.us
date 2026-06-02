export const EVENT_TYPES = [
  'Theater',
  'Live music',
  'Baseball',
  'Hockey',
  'Football',
  'Basketball',
  'Soccer',
  'Golf',
] as const

export const CONTACT_METHODS = [
  {value: 'email', label: 'Email'},
  {value: 'sms', label: 'Text'},
  {value: 'sms_same_day', label: 'Text for same-day events; email for events in advance'},
] as const

export const DEFAULT_CONTACT_METHOD = 'email'
