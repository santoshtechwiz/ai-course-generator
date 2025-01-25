"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function useGlobalLoading() {
  const { isLoading: isSubscriptionLoading } = useSubscriptionStore()
  const [isRouteChanging, setIsRouteChanging] = useState(false)
  //const pathname = usePathname()
  //const searchParams = useSearchParams()

  useEffect(() => {
    setIsRouteChanging(true)
    const timer = setTimeout(() => {
      setIsRouteChanging(false)
    }, 500) // Adjust this value to control the minimum loading time

    return () => clearTimeout(timer)
  }, []) //Removed pathname and searchParams

  return isSubscriptionLoading || isRouteChanging
}

