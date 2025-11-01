"use client"

import { usePathname } from "next/navigation"
import { BreadcrumbSchema as BreadcrumbSchemaComponent } from "@/lib/seo"

interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Generate breadcrumb items from pathname
 * Optimized for CourseAI's URL structure and sitelinks strategy
 */
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const baseUrl = "https://courseai.io"
  const items: BreadcrumbItem[] = [
    { name: "Home", url: "/" }
  ]

  if (pathname === "/") return items

  const segments = pathname.split("/").filter(Boolean)

  // Handle public pages (sitelinks priority)
  if (segments[0] === "features") {
    items.push({ name: "Features", url: "/features" })
  } else if (segments[0] === "pricing") {
    items.push({ name: "Pricing", url: "/pricing" })
  } else if (segments[0] === "about") {
    items.push({ name: "About", url: "/about" })
  } else if (segments[0] === "resources") {
    items.push({ name: "Resources", url: "/resources" })
  } else if (segments[0] === "contactus") {
    items.push({ name: "Contact", url: "/contactus" })
  } else if (segments[0] === "privacy") {
    items.push({ name: "Privacy Policy", url: "/privacy" })
  } else if (segments[0] === "terms") {
    items.push({ name: "Terms of Service", url: "/terms" })
  }

  return items
}

/**
 * BreadcrumbSchema Component
 * Adds BreadcrumbList structured data for improved navigation and sitelinks
 * Follows Google Search Central guidelines for breadcrumb markup
 */
export function BreadcrumbSchema() {
  const pathname = usePathname()
  const breadcrumbItems = generateBreadcrumbItems(pathname)

  // Only show breadcrumbs for pages beyond home
  if (breadcrumbItems.length <= 1) return null

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://courseai.io${item.url}`
    }))
  }

    return <BreadcrumbSchemaComponent items={breadcrumbItems} />
}