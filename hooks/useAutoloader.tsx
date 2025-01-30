"use client"

import { useLoaderContext } from "@/app/providers/laderContext"
import { useEffect } from "react"


export const useAutoLoader = () => {
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
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [setLoading])
}

