'use client'

import Logo from '@/app/Logo'
import {useActionState, useState} from 'react'
import PreferenceFields from '../preferences/PreferenceFields'
import {useContactPreferences} from '../preferences/useContactPreferences'
import {register} from './actions'

export default function RegisterForm({domain}: {domain: string}) {
  const [state, action, pending] = useActionState(register, null)
  const f = state?.fields
  const [phone, setPhone] = useState(f?.phone ?? '')
  const contact = useContactPreferences({
    initialContactMethod: f?.contactMethod,
    initialSmsConsent: f?.smsConsent,
    hasPhone: phone.trim() !== '',
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <Logo className="mx-auto mb-2 h-auto w-44" />
          <h1 className="card-title text-2xl">Create your account</h1>
          <p className="text-base-content/70 text-sm">
            We&apos;ll send a sign-in link to your email.
          </p>

          <form key={state?.key} action={action} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="domain" value={domain} />
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
                <span className="label-text-alt text-base-content/50">(must not be @{domain})</span>
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
              <p className="text-base-content/50 mt-1 text-xs">
                Ticket offers may be sent here, so use an email you check regularly.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="workEmail">
                <span className="label-text">Work email</span>
                <span className="label-text-alt text-base-content/50">(must be @{domain})</span>
              </label>
              <input
                id="workEmail"
                name="workEmail"
                type="email"
                autoComplete="work email"
                required
                defaultValue={f?.workEmail ?? `@${domain}`}
                className="input input-bordered w-full"
              />
              <p className="text-base-content/50 mt-1 text-xs">
                Used only to verify your eligibility for the program — we won&apos;t email you here.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="phone">
                <span className="label-text">Mobile phone number</span>
                <span className="label-text-alt text-base-content/50">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <PreferenceFields
              preferences={f}
              contactMethod={contact.contactMethod}
              onContactMethodChange={contact.setContactMethod}
              smsConsent={contact.smsConsent}
              onSmsConsentChange={contact.setSmsConsent}
              error={contact.error}
            />

            {state?.error && (
              <div role="alert" className="alert alert-error">
                <span>{state.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending || contact.error != null}
              className="btn btn-primary mt-2"
            >
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
