"use client"

import React from "react"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
