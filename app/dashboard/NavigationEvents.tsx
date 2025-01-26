"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLoaderContext } from "../providers/LoadingContext"


export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setLoading } = useLoaderContext()

  useEffect(() => {
    const url = pathname + searchParams.toString()
    setLoading(true)
    // You can add a small delay here if you want to show the loader for a minimum time
    const timer = setTimeout(() => {
        setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname, searchParams, setLoading])

  return null
}

