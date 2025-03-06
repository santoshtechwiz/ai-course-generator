import type React from "react"
import type { Metadata } from "next"
import { metadata as pageMetadata } from "./metadata"

export const metadata: Metadata = pageMetadata

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

