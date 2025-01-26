"use client"

import { usePathname } from "next/navigation"
import { useLoaderContext } from "../providers/LoadingContext"
import { useEffect } from "react"



export function NavigationEvents() {
  const pathname = usePathname()
  const { setLoading } = useLoaderContext()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const url = pathname + searchParams.toString()
    setLoading(true)

    // You can add a small delay here if you want to show the loader for a minimum time
    const timer = setTimeout(() => {
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname, setLoading])

  return null
}
