import {logout} from '@/app/logout/actions'

export default function AdminView({
  user,
  domains,
}: {
  user: {id: string; firstName: string; email: string}
  domains: string[]
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="card-title text-2xl">Admin — {user.firstName}</h1>
              <p className="text-base-content/60 text-sm">{user.email}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>
          <p className="text-base-content/70 text-sm">
            Admin view (placeholder). Domains: {domains.join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}
