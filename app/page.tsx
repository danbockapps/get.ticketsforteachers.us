import AdminView from '@/app/AdminView'
import LoggedInView from '@/app/LoggedInView'
import LoggedOutView from '@/app/LoggedOutView'
import {getUser} from '@/lib/auth'
import {db} from '@/lib/db'
import {admins} from '@/lib/schema'
import {eq} from 'drizzle-orm'

export default async function Home({searchParams}: {searchParams: Promise<{showSent?: string}>}) {
  const user = await getUser()
  if (!user) return <LoggedOutView />

  const adminRows = await db.select().from(admins).where(eq(admins.userId, user.id))
  if (adminRows.length > 0) {
    const domains: string[] = JSON.parse(adminRows[0].domains)
    const showSent = (await searchParams).showSent === '1'
    return <AdminView user={user} domains={domains} showSent={showSent} />
  }

  return <LoggedInView user={user} />
}
