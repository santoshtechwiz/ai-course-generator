'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="m-auto max-w-xl w-full px-4">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 text-center">
            <div className="text-6xl mb-4" role="img" aria-label="Worried face emoji">
              😟
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry, but we encountered an unexpected error.
            </p>
            {error.message && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
                <p className="font-bold">Error:</p>
                <p>{error.message}</p>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => reset()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              >
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && error.digest && (
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p>Error Digest: {error.digest}</p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}

