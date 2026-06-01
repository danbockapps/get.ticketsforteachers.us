import Link from 'next/link'
import Logo from '@/app/Logo'

const messages: Record<string, string> = {
  work: 'Your work email has been verified.',
  personal: 'Your email address has been verified.',
  phone: 'Your phone number has been verified.',
}

const errorMessages: Record<string, string> = {
  invalid: 'This verification link is invalid.',
  expired: 'This verification link has expired. Please request a new one.',
}

export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{type?: string; error?: string}>
}) {
  const {type, error} = await searchParams

  const isError = Boolean(error)
  const heading = isError ? 'Verification failed' : 'Verified'
  const icon = isError ? '⚠️' : '✅'
  const message = isError
    ? (errorMessages[error ?? ''] ?? 'We couldn’t verify this link.')
    : (messages[type ?? ''] ?? 'Your contact information has been verified.')

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <Link href="/">
            <Logo className="mb-1 h-auto w-44" />
          </Link>
          <div className="text-5xl">{icon}</div>
          <h1 className="card-title text-2xl">{heading}</h1>
          <p className="text-base-content/70">{message}</p>
        </div>
      </div>
    </div>
  )
}
