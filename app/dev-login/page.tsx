import {notFound} from 'next/navigation'
import {asc} from 'drizzle-orm'
import {db} from '@/lib/db'
import {users} from '@/lib/schema'
import {devLogin} from './actions'

export default async function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .orderBy(asc(users.email))

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Dev login</h1>
          <p className="text-base-content/70 text-sm">
            Click a user to sign in as them — dev only, no email required.
          </p>

          {allUsers.length === 0 ? (
            <p className="text-base-content/60 mt-4 text-sm">No users in the database yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {allUsers.map((user) => (
                <li key={user.id}>
                  <form action={devLogin}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" className="btn btn-outline btn-block justify-start">
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-base-content/60 ml-2 font-normal">{user.email}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
