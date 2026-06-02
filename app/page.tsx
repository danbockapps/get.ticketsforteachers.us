import AdminView from '@/app/AdminView'
import LoggedInView from '@/app/LoggedInView'
import LoggedOutView from '@/app/LoggedOutView'
import {getUser} from '@/lib/auth'
import {db} from '@/lib/db'
import {domainAdmins} from '@/lib/schema'
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

  const adminRows = await db
    .select({domain: domainAdmins.domain})
    .from(domainAdmins)
    .where(eq(domainAdmins.userId, user.id))
  if (adminRows.length > 0) {
    const domains = adminRows.map((r) => r.domain)
    const params = await searchParams
    const cookieDomain = (await cookies()).get('adminDomain')?.value
    return (
      <AdminView
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
