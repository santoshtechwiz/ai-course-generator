"use client"

import { ApiLoadingWrapperProps } from "@/app/types/types"
import { useLoading } from "./LoaderContext"
import { UnifiedLoader } from "./GlobalLoader"


export function ApiLoadingWrapper({ loadingId, children, fallback }: ApiLoadingWrapperProps) {
  const { isLoading } = useLoading()

  if (isLoading(loadingId)) {
    return <>{fallback || <UnifiedLoader id={loadingId} variant="spinner" />}</>
  }

  return <>{children}</>
}
