'use client'

import {useActionState} from 'react'
import PreferenceFields from '../preferences/PreferenceFields'
import {register} from './actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null)
  const f = state?.fields

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Create your account</h1>
          <p className="text-base-content/70 text-sm">
            We&apos;ll send a sign-in link to your email.
          </p>

          <form key={state?.key} action={action} className="mt-4 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label" htmlFor="firstName">
                  <span className="label-text">First name</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  defaultValue={f?.firstName}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="lastName">
                  <span className="label-text">Last name</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  defaultValue={f?.lastName}
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="email">
                <span className="label-text">Personal email</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={f?.email}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label" htmlFor="workEmail">
                <span className="label-text">Work email</span>
              </label>
              <input
                id="workEmail"
                name="workEmail"
                type="email"
                autoComplete="work email"
                required
                defaultValue={f?.workEmail}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label" htmlFor="phone">
                <span className="label-text">Mobile phone number</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                defaultValue={f?.phone}
                className="input input-bordered w-full"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <PreferenceFields preferences={f} />

            {state?.error && (
              <div role="alert" className="alert alert-error">
                <span>{state.error}</span>
              </div>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary mt-2">
              {pending ? <span className="loading loading-spinner loading-sm" /> : null}
              {pending ? 'Sending link…' : 'Create account'}
            </button>
          </form>

          <p className="text-base-content/60 mt-4 text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="link link-primary">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
