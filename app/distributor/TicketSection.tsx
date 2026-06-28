import TicketCard, {type TicketRow} from '@/app/distributor/TicketCard'

export default function TicketSection({
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
    <section className="flex flex-col gap-2">
      <h2 className="text-base-content/70 text-sm font-semibold uppercase tracking-wide">
        {title} ({ticketsInSection.length})
      </h2>
      <div className="flex flex-col gap-2">
        {ticketsInSection.map((t) => (
          <TicketCard key={t.id} ticket={t} emphasis={emphasis} />
        ))}
      </div>
    </section>
  )
}
