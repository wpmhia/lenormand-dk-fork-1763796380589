'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Cards Error
          </h1>
          <p className="text-gray-600">
            We encountered an error while loading the cards. Please try again.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}