'use client'

import {useSearchParams} from 'next/navigation'
import {Suspense, useActionState} from 'react'
import {login} from './actions'

const errorMessages: Record<string, string> = {
  invalid: 'That sign-in link is invalid.',
  expired: 'That sign-in link has expired. Please request a new one.',
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, null)
  const searchParams = useSearchParams()
  const linkError = searchParams.get('error')
  const workEmailVerified = searchParams.get('workEmailVerified') === 'true'

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Sign in</h1>
          <p className="text-base-content/70 text-sm">
            Enter your email and we&apos;ll send you a sign-in link.
          </p>

          <form action={action} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="email">
                <span className="label-text">Email</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                className="input input-bordered w-full"
              />
            </div>

            {workEmailVerified && (
              <div role="alert" className="alert alert-success">
                <span>Work email verified! Sign in with your personal email below.</span>
              </div>
            )}

            {(linkError || state?.error) && (
              <div role="alert" className="alert alert-error">
                <span>{linkError ? errorMessages[linkError] : state?.error}</span>
              </div>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary mt-2">
              {pending ? <span className="loading loading-spinner loading-sm" /> : null}
              {pending ? 'Sending link…' : 'Send sign-in link'}
            </button>
          </form>

          <p className="text-base-content/60 mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <a href="/register" className="link link-primary">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
