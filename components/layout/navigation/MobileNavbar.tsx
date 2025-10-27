"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { navItems } from "@/constants/navItems"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn, getColorClasses } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import { useAuth } from "@/modules/auth"

interface MobileNavbarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * MobileNavbar - Drawer-based mobile navigation
 *
 * Provides collapsible navigation drawer for mobile devices.
 * Includes main navigation items, user actions, and responsive design.
 */
function MobileNavbar({ isOpen, onOpenChange }: MobileNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { buttonPrimary, buttonSecondary } = getColorClasses()

  const handleNavigation = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="neutral"
          size="sm"
          className="md:hidden h-9 w-9 p-0 border-4 border-border shadow-neo bg-card hover:bg-muted"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-80 p-0 bg-card border-r-4 border-border shadow-neo"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-4 border-border">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => onOpenChange(false)}
                >
                  <Logo className="h-8 w-8" />
                  <span className="font-black text-lg text-foreground">CourseAI</span>
                </Link>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 p-0 hover:bg-muted"
                  aria-label="Close mobile menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                      <motion.div
                        key={item.href}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={isActive ? "default" : "neutral"}
                          className={cn(
                            "w-full justify-start h-12 px-4 border-4 shadow-neo font-bold",
                            isActive
                              ? cn(buttonPrimary, "border-border")
                              : "border-transparent hover:border-border hover:bg-muted"
                          )}
                          onClick={() => handleNavigation(item.href)}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Button>
                      </motion.div>
                    )
                  })}
                </nav>

                {/* User Section */}
                {isAuthenticated && user && (
                  <div className="mt-8 pt-4 border-t-4 border-border">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-muted-foreground px-4">
                        Welcome back, {user.name || 'User'}!
                      </p>
                      <Button
                        variant="neutral"
                        className={cn(
                          "w-full justify-start h-12 px-4 border-4 border-border shadow-neo font-bold",
                          buttonSecondary
                        )}
                        onClick={() => handleNavigation('/dashboard')}
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                )}

                {/* Auth Section */}
                {!isAuthenticated && (
                  <div className="mt-8 pt-4 border-t-4 border-border">
                    <div className="space-y-2">
                      <Button
                        variant="neutral"
                        className={cn(
                          "w-full justify-start h-12 px-4 border-4 border-border shadow-neo font-bold",
                          buttonPrimary
                        )}
                        onClick={() => handleNavigation('/auth/signin')}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="neutral"
                        className="w-full justify-start h-12 px-4 border-4 border-border shadow-neo font-bold hover:bg-muted"
                        onClick={() => handleNavigation('/auth/signup')}
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t-4 border-border">
                <p className="text-xs text-muted-foreground text-center font-medium">
                  © 2025 CourseAI. All rights reserved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNavbar