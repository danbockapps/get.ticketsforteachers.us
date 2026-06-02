import Logo from '@/app/Logo'
import {logout} from '@/app/logout/actions'
import PreferencesForm from '@/app/preferences/PreferencesForm'
import {resendPhoneVerification} from '@/app/preferences/actions'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
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

          <div className="flex flex-col gap-1">
            <p className="text-base-content/50 text-xs font-medium uppercase tracking-wide">
              Contact
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{dbUser?.phone ?? '—'}</span>
              {dbUser?.phoneVerified ? (
                <span className="badge badge-success badge-sm">Verified</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="badge badge-warning badge-sm">Unverified</span>
                  {dbUser?.phone && (
                    <form action={resendPhoneVerification}>
                      <button type="submit" className="btn btn-ghost btn-xs">
                        Resend text
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="divider my-0" />

          <PreferencesForm preferences={preferences} />
        </div>
      </div>
    </div>
  )
}
