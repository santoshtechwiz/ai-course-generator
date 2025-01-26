import type React from "react"
import NextLink, { type LinkProps as NextLinkProps } from "next/link"
import { GlobalLoading } from "@/hooks/useGlobalLoading"

interface LinkProps extends NextLinkProps {
  children: React.ReactNode
  className?: string
}

export function Link({ children, ...props }: LinkProps) {
  const handleClick = () => {
    GlobalLoading.show()
    // We'll hide the loader after a short delay to account for quick navigations
    setTimeout(() => {
      GlobalLoading.hide()
    }, 500)
  }

  return (
    <NextLink {...props} onClick={handleClick}>
      {children}
    </NextLink>
  )
}

