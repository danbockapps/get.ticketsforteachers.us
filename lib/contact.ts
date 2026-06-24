// Shared validation/normalization for the verifiable contact fields (phone and
// work email), used by both registration and the post-registration edit flows.

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Strips everything but digits.
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

// Returns an E.164 number, or null if there aren't enough digits to be a valid
// mobile number.
export function toE164(raw: string): string | null {
  const digits = normalizePhone(raw)
  if (digits.length < 10) return null
  return digits.length === 10 ? `+1${digits}` : `+${digits}`
}

// True when the email's host is the domain itself or a subdomain of it.
export function emailInDomain(email: string, domain: string): boolean {
  const host = email.slice(email.lastIndexOf('@') + 1)
  return host === domain || host.endsWith(`.${domain}`)
}

// The host portion of an email address (lowercased input expected).
export function emailHost(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1)
}
