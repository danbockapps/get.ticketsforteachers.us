import {OFFER_COOLDOWN_MS} from '@/app/distributor/tickets/[id]/offer/constants'

export function computeCooldownMap(lastOfferByUser: Map<string, string>): Map<string, boolean> {
  const now = Date.now()
  const out = new Map<string, boolean>()
  for (const [userId, sentAt] of lastOfferByUser) {
    out.set(userId, now - new Date(sentAt).getTime() < OFFER_COOLDOWN_MS)
  }
  return out
}
