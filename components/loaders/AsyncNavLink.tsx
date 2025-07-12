"use client"
import React from "react"
import Link, { LinkProps } from "next/link"
import { useRouter } from "next/navigation"
import { useGlobalLoader } from "@/store/global-loader"

interface AsyncNavLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  [key: string]: any
}

export function AsyncNavLink({
  children,
  href,
  className = "",
  prefetch = true,
  ...props
}: AsyncNavLinkProps) {
  const router = useRouter()
  const { startLoading } = useGlobalLoader()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (props.onClick) props.onClick(e)
    if (e.defaultPrevented) return
    startLoading({ message: "Loading page...", isBlocking: true })
    router.push(typeof href === "string" ? href : (href as any).toString())
  }

  return (
    <Link
      href={href}
      className={className}
      prefetch={prefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  )
}

export default AsyncNavLink
