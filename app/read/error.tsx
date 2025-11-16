'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Reading Error
          </h1>
          <p className="text-gray-600">
            We encountered an error while loading your reading. Please try again.
          </p>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}