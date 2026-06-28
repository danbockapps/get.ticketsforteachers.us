import TicketCard, {type TicketRow} from '@/app/distributor/TicketCard'

export default function CollapsibleTicketSection({
  title,
  emphasis,
  ticketsInSection,
}: {
  title: string
  emphasis: 'high' | 'normal' | 'muted'
  ticketsInSection: TicketRow[]
}) {
  if (ticketsInSection.length === 0) return null
  return (
    <details className="flex flex-col gap-2">
      <summary className="text-base-content/70 cursor-pointer text-sm font-semibold uppercase tracking-wide">
        {title} ({ticketsInSection.length})
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {ticketsInSection.map((t) => (
          <TicketCard key={t.id} ticket={t} emphasis={emphasis} />
        ))}
      </div>
    </details>
  )
}
