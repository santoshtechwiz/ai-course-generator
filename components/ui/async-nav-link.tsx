"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

import { useGlobalLoader } from "@/store/global-loader"
import { GlobalLoader } from "@/components/ui/loader"

interface AsyncNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  loaderOptions?: {
    message?: string
    subMessage?: string
    variant?: "spinner" | "dots" | "pulse" | "skeleton"
    theme?: "primary" | "secondary" | "accent" | "neutral"
    isBlocking?: boolean
    priority?: number
  }
}

export function AsyncNavLink({ href, children, className, onClick, loaderOptions = {} }: AsyncNavLinkProps) {  const router = useRouter()
  const pathname = usePathname()
  const { startLoading } = useGlobalLoader()
  const isActive = pathname === href
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      
      const options = {
        message: loaderOptions.message || "Navigating...",
        isBlocking: true,
        ...loaderOptions,
      }

      startLoading(options)

      if (onClick) onClick()

      // Small delay to show loader before navigation
      setTimeout(() => {
        router.push(href)
        // Note: loader will be automatically hidden by navigation hook
      }, 50)
    },
    [href, router, startLoading, onClick, loaderOptions],
  )

  return (
    <a href={href} onClick={handleClick} className={className} aria-current={isActive ? "page" : undefined}>
      {children}
    </a>
  )
}

// [DELETED: Moved to components/loaders/AsyncNavLink.tsx. Use that instead.]
