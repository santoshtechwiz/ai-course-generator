"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { useAuth } from "@/modules/auth"
import { cn } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import { CreditsDisplay } from "./CreditsDisplay"
import { UserAvatar } from "./UserAvatar"

// ⚡ PERFORMANCE: Lazy load heavy components to reduce initial bundle
const SearchModal = lazy(() => import("@/components/layout/navigation/SearchModal"))
const NotificationsMenu = lazy(() => import("@/components/Navbar/NotificationsMenu"))
const CourseNotificationsMenu = lazy(() => import("@/components/Navbar/CourseNotificationsMenu"))

/**
 * MainNavbar - Single source of truth using useAuth
 * 
 * ✅ Uses unified useAuth hook only (no dual hooks)
 * ✅ All data comes from one place
 * ✅ No manual session sync needed
 * ✅ Clean and maintainable
 */
export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  
  // ✅ Single source of truth - useAuth provides everything
  const {
    user,
    isAuthenticated,
    credits,
    tokensUsed,
    remainingCredits,
    plan,
    isLoading,
  } = useAuth()

  // Compute available credits (already computed in useAuth, but keeping for compatibility)
  const totalTokens = credits || 0
  const subscriptionPlan = plan || "FREE"
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[MainNavbar] Single source state:', {
      credits: totalTokens,
      used: tokensUsed,
      remaining: remainingCredits,
      plan: subscriptionPlan,
      isAuthenticated,
      isLoading,
    })
  }

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Use pre-computed remainingCredits from useAuth (already memoized)
  const availableCredits = remainingCredits ?? 0

  const userInitials = useMemo(() => {
    const name = user?.name || ""
    return (
      name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    )
  }, [user?.name])

  const handleSignIn = useCallback(() => {
    router.push("/api/auth/signin")
  }, [router])

  const handleSearchResult = useCallback(
    (url: string) => {
      router.push(url)
      setIsSearchModalOpen(false)
    },
    [router],
  )

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50"
            : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg",
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <nav className="flex items-center space-x-1 overflow-x-auto lg:overflow-x-visible">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-xl transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Only show credits when authenticated and not loading */}
            {isAuthenticated && !isLoading && (
              <CreditsDisplay
                availableCredits={availableCredits}
                subscriptionPlan={subscriptionPlan}
                isPremium={subscriptionPlan !== "FREE"}
                prefersReducedMotion={false}
              />
            )}

            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setIsSearchModalOpen(true)}
              className="rounded-xl"
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle />

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
                  <CourseNotificationsMenu />
                  <NotificationsMenu />
                </Suspense>
                <UserMenu
                 
                />
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                Sign in
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-xl">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 bg-background">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <Logo />
                    <ThemeToggle />
                  </div>
                  <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block px-3 py-2 rounded-lg min-h-[44px] flex items-center", // 44px touch target
                            active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                  <div className="p-4 border-t space-y-3">
                    {isAuthenticated ? (
                      availableCredits !== null && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Credits</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium tabular-nums">
                              {availableCredits.toLocaleString()}
                            </span>
                            {subscriptionPlan !== "FREE" && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                {subscriptionPlan}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <Button className="w-full min-h-[44px]" onClick={handleSignIn}>
                        Sign in
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      <Suspense fallback={null}>
        <SearchModal
          isOpen={isSearchModalOpen}
          setIsOpen={setIsSearchModalOpen}
          onResultClick={handleSearchResult}
        />
      </Suspense>
    </>
  )
}
