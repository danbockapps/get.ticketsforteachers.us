import DistributorView from '@/app/DistributorView'
import LoggedInView from '@/app/LoggedInView'
import LoggedOutView from '@/app/LoggedOutView'
import {getUser} from '@/lib/auth'
import {db} from '@/lib/db'
import {domainDistributors} from '@/lib/schema'
import {eq} from 'drizzle-orm'
import {cookies} from 'next/headers'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    domain?: string
  }>
}) {
  const user = await getUser()
  if (!user) return <LoggedOutView />

  const distributorRows = await db
    .select({domain: domainDistributors.domain})
    .from(domainDistributors)
    .where(eq(domainDistributors.userId, user.id))
  if (distributorRows.length > 0) {
    const domains = distributorRows.map((r) => r.domain)
    const params = await searchParams
    const cookieDomain = (await cookies()).get('distributorDomain')?.value
    return (
      <DistributorView
        user={user}
        domains={domains}
        from={params.from ?? null}
        to={params.to ?? null}
        domainFilter={params.domain ?? cookieDomain ?? null}
      />
    )
  }

  return <LoggedInView user={user} />
}
