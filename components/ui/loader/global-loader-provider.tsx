"use client"

import React from 'react'
import { GlobalLoader } from './global-loader'
import { useNavigationLoader } from './use-navigation-loader'

/**
 * Global Loader Provider
 * This component should be placed at the root of your app to enable
 * automatic loading states and navigation loaders
 */
export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  // Enable automatic navigation loading
  useNavigationLoader()

  return (
    <>
      {children}
      <GlobalLoader />
    </>
  )
}

export default GlobalLoaderProvider
