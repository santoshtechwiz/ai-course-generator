"use client"

import { usePathname } from "next/navigation"
import Footer from "@/components/shared/Footer"

/**
 * Conditional Footer Component
 * Hides footer only on specific dashboard pages with sidebar navigation
 * 
 * Pages without footer (sidebar-enabled):
 * - /dashboard/home
 * - /dashboard/courses  
 * - /dashboard/explore
 * - /dashboard/account
 * - /dashboard/subscription
 */
export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Exact routes where footer should be hidden (sidebar-enabled pages)
  const noFooterRoutes = [
    '/dashboard/home',
    '/dashboard/courses',
    '/dashboard/explore',
    '/dashboard/account',
    '/dashboard/subscription',
  ]
  
  // Check if current path matches any no-footer route
  const shouldHideFooter = noFooterRoutes.some(route => pathname === route)
  
  if (shouldHideFooter) {
    return null
  }
  
  return <Footer />
}
