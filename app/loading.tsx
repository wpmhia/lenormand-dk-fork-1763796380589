export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-b-2 border-blue-500 animate-spin mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    </div>
  )
}