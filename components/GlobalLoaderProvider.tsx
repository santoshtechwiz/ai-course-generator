"use client"

import React from "react"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"
import { useRouteLoaderBridge } from "@/store/loaders/global-loader"

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  // Bridge to route changes with minimal loader
  useRouteLoaderBridge()

  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
