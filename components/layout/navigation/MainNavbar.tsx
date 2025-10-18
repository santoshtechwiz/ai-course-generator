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
import { cn, getColorClasses } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import { CreditsDisplay } from "./CreditsDisplay"
import { UserAvatar } from "./UserAvatar"
import { CreditCounter } from "@/components/shared/CreditCounter"

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
  
  // Debug logging once on mount or when key values change (not on every render)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MainNavbar] Auth state changed:', {
        credits: totalTokens,
        used: tokensUsed,
        remaining: remainingCredits,
        plan: subscriptionPlan,
        isAuthenticated,
      })
    }
  }, [isAuthenticated, subscriptionPlan]) // Only log when these change

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

  // Get Neobrutalism utility classes
  const { buttonPrimary, buttonIcon, badgeCount } = getColorClasses()

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "bg-background border-b-4 border-border",
          isScrolled && "shadow-[0_4px_0px_0px_rgba(0,0,0,0.1)]",
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>

          {/* Desktop Nav - Neobrutalism style with bold borders */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-bold transition-all duration-100",
                    "border-3 border-transparent rounded-lg",
                    active 
                      ? "border-border bg-main text-main-foreground shadow-[3px_3px_0px_0px_hsl(var(--border))]" 
                      : "hover:border-border hover:bg-secondary-background hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side - Neobrutalism style buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Enhanced credit counter with warnings and detailed popover */}
            {isAuthenticated && !isLoading && (
              <div className="hidden sm:flex">
                <CreditCounter />
              </div>
            )}

            {/* Search - Neobrutalism button */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setIsSearchModalOpen(true)}
              className={cn(
                buttonIcon,
                "hover:translate-y-[-2px] transition-all duration-100"
              )}
            >
              <Search className="h-4 w-4" />
            </Button>

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}>
                  <CourseNotificationsMenu />
                  <NotificationsMenu />
                </Suspense>
                <UserMenu />
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                className={cn(
                  "hidden sm:flex",
                  buttonPrimary,
                  "min-h-[40px]"
                )}
                size="sm"
              >
                Sign in
              </Button>
            )}

            {/* Mobile Menu - Neobrutalism style */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild suppressHydrationWarning>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "md:hidden",
                    buttonIcon,
                    "hover:translate-y-[-2px] transition-all duration-100"
                  )}
                  suppressHydrationWarning
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0 bg-background border-l-4 border-border">
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b-4 border-border flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block px-4 py-3 min-h-[48px] flex items-center font-bold border-3 rounded-lg transition-all duration-100",
                            active 
                              ? "bg-main text-main-foreground border-border shadow-[3px_3px_0px_0px_hsl(var(--border))]" 
                              : "border-transparent hover:border-border hover:bg-secondary-background hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]",
                          )}
                        >
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                  
                  {/* Footer */}
                  <div className="p-4 border-t-4 border-border space-y-3">
                    {isAuthenticated ? (
                      <>
                        {availableCredits !== null && (
                          <div className="flex items-center justify-between p-3 bg-secondary-background border-3 border-border rounded-lg shadow-[3px_3px_0px_0px_hsl(var(--border))]">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4" />
                              <span className="text-sm font-bold">Credits</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-black tabular-nums">
                                {availableCredits.toLocaleString()}
                              </span>
                              {subscriptionPlan !== "FREE" && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 border-2 border-border font-black">
                                  {subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 md:hidden">
                          <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}>
                            <CourseNotificationsMenu />
                            <NotificationsMenu />
                          </Suspense>
                        </div>
                      </>
                    ) : (
                      <Button 
                        className={cn(
                          "w-full min-h-[48px]",
                          buttonPrimary
                        )}
                        onClick={() => {
                          handleSignIn()
                          setIsMobileMenuOpen(false)
                        }}
                      >
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
