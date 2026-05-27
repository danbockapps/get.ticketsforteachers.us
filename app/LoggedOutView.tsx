export default function LoggedOutView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-2xl">Welcome</h1>
          <p className="text-base-content/70">You are not logged in.</p>
          <div className="card-actions mt-2">
            <a href="/register" className="btn btn-primary">
              Create an account
            </a>
            <a href="/login" className="btn btn-ghost">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
