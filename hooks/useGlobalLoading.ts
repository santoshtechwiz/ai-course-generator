"use client"

import { useState, useEffect, useCallback } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function useGlobalLoading(): [boolean, () => void, () => void] {
  const { isLoading: isSubscriptionLoading } = useSubscriptionStore()
  const [isRouteChanging, setIsRouteChanging] = useState(false)
  const [isManuallyTriggered, setIsManuallyTriggered] = useState(false)

  useEffect(() => {
    setIsRouteChanging(true)
    const timer = setTimeout(() => {
      setIsRouteChanging(false)
    }, 500) // Adjust this value to control the minimum loading time

    return () => clearTimeout(timer)
  }, [])

  const show = useCallback(() => setIsManuallyTriggered(true), [])
  const hide = useCallback(() => setIsManuallyTriggered(false), [])

  const isLoading = isSubscriptionLoading || isRouteChanging || isManuallyTriggered

  return [isLoading, show, hide]
}

export const GlobalLoading = {
  show: () => {},
  hide: () => {},
}

let setGlobalLoading: (show: boolean) => void = () => {}

export const initGlobalLoading = (setLoading: (show: boolean) => void) => {
  setGlobalLoading = setLoading
  GlobalLoading.show = () => setGlobalLoading(true)
  GlobalLoading.hide = () => setGlobalLoading(false)
}

