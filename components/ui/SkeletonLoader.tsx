"use client"

import { useGlobalLoading } from "@/store/slices/global-loading-slice"
import { useEffect } from "react"

export function SubscriptionSkeleton() {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    const loaderId = showLoading({
      variant: 'skeleton',
      isBlocking: false,
      priority: 1
    })

    return () => {
      hideLoading(loaderId)
    }
  }, [showLoading, hideLoading])

  return null // Loading handled by GlobalLoader
}

export function LoadingCard({
  message = "Loading...",
  className,
}: {
  message?: string
  className?: string
}) {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    const loaderId = showLoading({
      message,
      variant: 'spinner',
      theme: 'primary',
      isBlocking: false,
      priority: 1
    })

    return () => {
      hideLoading(loaderId)
    }
  }, [message, showLoading, hideLoading])

  return null // Loading handled by GlobalLoader
}

export function LoadingSkeleton({ className }: { className?: string }) {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    const loaderId = showLoading({
      variant: 'skeleton',
      isBlocking: false,
      priority: 1
    })

    return () => {
      hideLoading(loaderId)
    }
  }, [showLoading, hideLoading])

  return null // Loading handled by GlobalLoader
}

export default SubscriptionSkeleton
