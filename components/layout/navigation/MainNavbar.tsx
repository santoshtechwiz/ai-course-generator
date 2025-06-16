"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Menu, X, CreditCard, Sparkles } from "lucide-react"
import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Logo from "./Logo"
import useSubscription from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import { cn } from "@/lib/utils"
import { AsyncNavLink } from "@/components/ui/enhanced-loader"

export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  const { user, isAuthenticated, isLoading: authLoading, status: authStatus } = useAuth()
  const { totalTokens, tokenUsage, subscriptionPlan, isLoading: isSubscriptionLoading } = useSubscription()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [ready, setReady] = useState(false)

  // Optimized scroll handler
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Ready state for smooth animations
  useEffect(() => {
    if (authStatus !== "loading") {
      const timer = setTimeout(() => setReady(true), 100)
      return () => clearTimeout(timer)
    }
  }, [authStatus])

  // Memoized calculations
  const availableCredits = useMemo(() => {
    const credits = totalTokens ?? user?.credits ?? 0
    if (typeof credits === "number" && typeof tokenUsage === "number") {
      return Math.max(0, credits - tokenUsage)
    }
    return null
  }, [totalTokens, user?.credits, tokenUsage])

  const userInitials = useMemo(() => {
    const name = user?.name || ""
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    )
  }, [user?.name])

  // Handlers
  const handleSearchOpen = useCallback(() => setIsSearchModalOpen(true), [])
  const handleSearchClose = useCallback(() => setIsSearchModalOpen(false), [])
  const handleMobileMenuToggle = useCallback(() => setIsMobileMenuOpen((prev) => !prev), [])
  const handleSignIn = useCallback(() => router.push("/api/auth/signin"), [router])

  const handleSearchResult = useCallback(
    (url: string) => {
      router.push(url)
      handleSearchClose()
    },
    [router, handleSearchClose],
  )

  // Navigation items with active state
  const navigationItems = useMemo(
    () =>
      navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <AsyncNavLink
            href={item.href}
            key={item.name}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "text-primary bg-primary/5 shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`nav-item-${item.name.toLowerCase()}`}
          >
            {item.name}
            {isActive && <div className="absolute inset-x-1 -bottom-px h-px bg-primary rounded-full" />}
          </AsyncNavLink>
        )
      }),
    [pathname],
  )

  // Mobile navigation items
  const mobileNavigationItems = useMemo(
    () =>      navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <AsyncNavLink
            href={item.href}
            key={item.name}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center px-4 py-3 text-base font-medium transition-colors rounded-lg",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "text-primary bg-primary/5 border-l-2 border-primary" : "text-muted-foreground",
            )}
          >
            {item.name}
          </AsyncNavLink>
        )
      }),
    [pathname],
  )

  // Credits display component
  const CreditsDisplay = useMemo(() => {
    if (!isAuthenticated) return null

    if (availableCredits === null) {
      return (
        <div className="hidden lg:flex items-center space-x-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      )
    }

    const isLowCredits = availableCredits < 100
    const isPremium = subscriptionPlan && subscriptionPlan !== "FREE"

    return (
      <div className="hidden lg:flex items-center space-x-2" data-testid="credits-display">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-card border rounded-lg shadow-sm">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span
            className={cn("text-sm font-medium tabular-nums", isLowCredits ? "text-destructive" : "text-foreground")}
          >
            {availableCredits.toLocaleString()}
          </span>
        </div>
        {isPremium && (
          <Badge variant="secondary" className="text-xs font-medium">
            <Sparkles className="h-3 w-3 mr-1" />
            {subscriptionPlan}
          </Badge>
        )}
      </div>
    )
  }, [isAuthenticated, availableCredits, subscriptionPlan])

  // User avatar component
  const UserAvatar = useMemo(
    () => (
      <Avatar className="h-8 w-8 border-2 border-border/50 hover:border-primary/50 transition-all duration-200">
        <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
      </Avatar>
    ),
    [user?.image, user?.name, userInitials],
  )

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          "border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
          scrolled && "shadow-sm bg-background/95 supports-[backdrop-filter]:bg-background/80",
        )}
        data-testid="main-navbar"
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" data-testid="nav-items">
            {navigationItems}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Credits Display */}
            {CreditsDisplay}

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchOpen}
              className="h-9 w-9 hover:bg-accent"
              aria-label="Search"
              data-testid="search-button"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications - Desktop Only */}
            {isAuthenticated && (
              <div
                className={cn(
                  "hidden sm:block transition-all duration-300",
                  ready ? "opacity-100 scale-100" : "opacity-0 scale-95",
                )}
              >
                <NotificationsMenu />
              </div>
            )}

            {/* User Menu */}
            <div className={cn("transition-all duration-300", ready ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
              <UserMenu>
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-accent transition-colors"
                    aria-label="User menu"
                  >
                    {UserAvatar}
                  </Button>
                ) : authLoading ? (
                  <Skeleton className="h-9 w-9 rounded-full" />
                ) : (
                  <Button variant="default" size="sm" onClick={handleSignIn} className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                )}
              </UserMenu>
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Toggle menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <Logo />
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile User Section */}
                  {isAuthenticated && (
                    <div className="py-4 border-b">
                      <div className="flex items-center space-x-3 mb-3">
                        {UserAvatar}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>

                      {/* Mobile Credits */}
                      {availableCredits !== null && (
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Credits</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold tabular-nums">
                              {availableCredits.toLocaleString()}
                            </span>
                            {subscriptionPlan && subscriptionPlan !== "FREE" && (
                              <Badge variant="secondary" className="text-xs">
                                {subscriptionPlan}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile Navigation */}
                  <nav className="flex-1 py-4 space-y-1">{mobileNavigationItems}</nav>

                  {/* Mobile Footer */}
                  <div className="pt-4 border-t space-y-3">
                    {/* Mobile Notifications */}
                    {isAuthenticated && (
                      <div className="flex items-center justify-center">
                        <NotificationsMenu />
                      </div>
                    )}

                    {/* Mobile Sign In */}
                    {!isAuthenticated && !authLoading && (
                      <Button onClick={handleSignIn} className="w-full" size="lg">
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
    </>
  )
}
