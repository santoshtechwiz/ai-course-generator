"use client"

import { useLoaderContext } from "../providers/laderContext"



export function LoadingBar() {
  const { isLoading, progress } = useLoaderContext()

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-red-200 z-50">
      <div className="h-full bg-red-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}

