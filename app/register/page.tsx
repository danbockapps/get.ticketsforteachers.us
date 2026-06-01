import {eq} from 'drizzle-orm'
import Logo from '@/app/Logo'
import {db} from '@/lib/db'
import {domains} from '@/lib/schema'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  const domainParam = (await searchParams).domain
  const domain = typeof domainParam === 'string' ? domainParam : undefined

  const known =
    domain != null && (await db.select().from(domains).where(eq(domains.domain, domain))).length > 0

  if (!known) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <Logo className="mb-2 h-auto w-44" />
            <p className="text-base-content/70">
              Thank you for your interest in Tickets for Teachers! To register, please follow the
              link provided by your program administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <RegisterForm domain={domain} />
}
