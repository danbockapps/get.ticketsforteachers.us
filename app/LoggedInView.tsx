import Logo from '@/app/Logo'
import {logout} from '@/app/logout/actions'
import PreferencesForm from '@/app/preferences/PreferencesForm'
import PhoneField from '@/app/preferences/PhoneField'
import WorkEmailField from '@/app/preferences/WorkEmailField'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {hasSmsConsent} from '@/lib/consent'
import {eq} from 'drizzle-orm'

export default async function LoggedInView({
  user,
}: {
  user: {id: string; firstName: string; email: string}
}) {
  const rows = await db.select().from(users).where(eq(users.id, user.id))
  const dbUser = rows[0]
  const preferences = {
    eventTypes: dbUser?.eventPreferences ? JSON.parse(dbUser.eventPreferences) : [],
    contactMethod: dbUser?.contactMethod,
    smsConsent: dbUser ? await hasSmsConsent(dbUser.id) : false,
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-6">
          <Logo className="h-auto w-32" />
          <div className="flex items-start justify-between">
            <div>
              <h1 className="card-title text-2xl">Welcome, {user.firstName}!</h1>
              <p className="text-base-content/60 text-sm">{user.email}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>

          <div className="divider my-0" />

          <WorkEmailField
            workEmail={dbUser?.workEmail ?? ''}
            verified={dbUser?.workEmailVerified ?? false}
          />

          <PhoneField phone={dbUser?.phone ?? null} verified={dbUser?.phoneVerified ?? false} />

          <div className="divider my-0" />

          <PreferencesForm preferences={preferences} hasPhone={dbUser?.phone != null} />
        </div>
      </div>
    </div>
  )
}
