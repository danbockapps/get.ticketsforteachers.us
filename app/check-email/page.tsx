export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{emails?: string}>
}) {
  const {emails} = await searchParams
  const twoEmails = emails === '2'

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="text-5xl">📬</div>
          <h1 className="card-title text-2xl">Check your email</h1>
          {twoEmails ? (
            <p className="text-base-content/70">
              We sent verification links to your personal and work email addresses. Click both links
              to verify your account. Links expire in 15 minutes.
            </p>
          ) : (
            <p className="text-base-content/70">
              We sent you a sign-in link. It will expire in 15 minutes.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
