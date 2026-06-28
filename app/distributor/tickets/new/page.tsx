import CreateTicketForm from '@/app/distributor/tickets/new/CreateTicketForm'
import {requireDistributor} from '@/lib/auth'

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{domain?: string}>
}) {
  const {domains} = await requireDistributor()
  const {domain} = await searchParams
  const defaultDomain = domain && domains.includes(domain) ? domain : undefined

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl">Create ticket</h1>
            <p className="text-base-content/70 text-sm">
              The ticket will be created as <span className="font-medium">unclaimed</span>. You can
              offer it to users from the dashboard once saved.
            </p>
            <CreateTicketForm domains={domains} defaultDomain={defaultDomain} />
          </div>
        </div>
      </div>
    </div>
  )
}
