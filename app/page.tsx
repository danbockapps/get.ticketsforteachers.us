import AdminView from '@/app/AdminView'
import LoggedInView from '@/app/LoggedInView'
import LoggedOutView from '@/app/LoggedOutView'
import {getUser} from '@/lib/auth'
import {db} from '@/lib/db'
import {admins} from '@/lib/schema'
import {eq} from 'drizzle-orm'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    showSent?: string
    from?: string
    to?: string
    domain?: string
  }>
}) {
  const user = await getUser()
  if (!user) return <LoggedOutView />

  const adminRows = await db.select().from(admins).where(eq(admins.userId, user.id))
  if (adminRows.length > 0) {
    const domains: string[] = JSON.parse(adminRows[0].domains)
    const params = await searchParams
    return (
      <AdminView
        user={user}
        domains={domains}
        showSent={params.showSent === '1'}
        from={params.from ?? null}
        to={params.to ?? null}
        domainFilter={params.domain ?? null}
      />
    )
  }

  return <LoggedInView user={user} />
}
