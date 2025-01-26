"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLoaderContext } from "@/app/providers/LoadingContext"



export const useAutoLoader = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setLoading } = useLoaderContext()

  useEffect(() => {
    const handleStart = () => setLoading(true)
    const handleComplete = () => setLoading(false)

    // Add event listeners
    window.addEventListener("beforeunload", handleStart)
    document.addEventListener("visibilitychange", handleComplete)

    return () => {
      // Remove event listeners
      window.removeEventListener("beforeunload", handleStart)
      document.removeEventListener("visibilitychange", handleComplete)
    }
  }, [setLoading])

  useEffect(() => {
    setLoading(false)
  }, [setLoading])
}

