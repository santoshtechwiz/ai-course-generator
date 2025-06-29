"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

import { useLoader, type LoaderContext } from "./loader"

interface AsyncNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  loaderOptions?: {
    message?: string
    context?: LoaderContext
    variant?: "inline" | "fullscreen" | "button" | "card" | "overlay"
  }
}

export function AsyncNavLink({ href, children, className, onClick, loaderOptions = {} }: AsyncNavLinkProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { showLoader } = useLoader()
  const isActive = pathname === href

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()

      const options = {
        variant: "fullscreen" as const,
        message: "Loading...",
        context: "loading" as const,
        showProgress: false,
        ...loaderOptions,
      }

      showLoader(options)

      if (onClick) onClick()

      setTimeout(() => {
        router.push(href)
      }, 50)
    },
    [href, router, showLoader, onClick, loaderOptions],
  )

  return (
    <a href={href} onClick={handleClick} className={className} aria-current={isActive ? "page" : undefined}>
      {children}
    </a>
  )
}
