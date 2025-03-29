"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/breadcrumb"


export default function AdminHeader() {
  const pathname = usePathname()

  // Extract path segments for breadcrumbs
  const segments = pathname.split("/").filter(Boolean)

  // Create breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    const isLast = index === segments.length - 1

    // Format the segment for display (capitalize, replace hyphens with spaces)
    const formattedSegment = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return {
      href,
      label: formattedSegment,
      isLast,
    }
  })

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
      <div className="flex items-center gap-2">
        {segments.length > 2 && (
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/dashboard/admin">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Admin
            </Link>
          </Button>
        )}

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {breadcrumbItems.map((item, index) => (
              <BreadcrumbItem key={item.href}>
                {!item.isLast ? (
                  <>
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <span className="font-medium">{item.label}</span>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  )
}

