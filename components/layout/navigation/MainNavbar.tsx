"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Sparkles, Bell } from "lucide-react"
import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { useAuth, useSubscription } from "@/modules/auth"
import { useAppDispatch, useAppSelector } from "@/store"
import { forceSyncSubscription, selectIsSubscriptionFetching } from "@/store/slices/subscription-slice"
import { progressApi } from "@/components/loaders/progress-api"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import CourseNotificationsMenu from "@/components/Navbar/CourseNotificationsMenu"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Logo from "@/components/shared/Logo"

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const subscription = useSubscription()
  const dispatch = useAppDispatch()
  const subFetching = useAppSelector(selectIsSubscriptionFetching as any) as boolean
  const syncedOnceRef = useRef(false)
  // Force fresh subscription sync (Navbar always fresh) once per mount
  useEffect(() => {
    if (syncedOnceRef.current) return
    syncedOnceRef.current = true
    let active = true
    const run = async () => {
      try {
        if (!progressApi.isStarted()) progressApi.start()
        await dispatch(forceSyncSubscription()).unwrap()
      } catch (error) {
        // Log the error for debugging but don't crash the app
        console.warn('Subscription sync failed in MainNavbar, continuing with cached data:', error)
      } finally {
        if (active) progressApi.done()
      }
    }
    run()
    return () => { active = false }
  }, [dispatch])
  const prefersReducedMotion = useReducedMotion()

  // Extract subscription details
  const totalTokens = user?.credits || 0
  const tokenUsage = 0 // TODO: Track token usage
  const subscriptionPlan = subscription?.subscription.plan || "FREE"

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isTyping = tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable

      // Cmd/Ctrl+K opens search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsSearchModalOpen(true)
        return
      }

      // / quick search if not typing
      if (!isTyping && e.key === "/") {
        e.preventDefault()
        setIsSearchModalOpen(true)
      }

      // Escape closes modals
      if (e.key === "Escape") {
        setIsSearchModalOpen(false)
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

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
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    )
  }, [user])

  // Handlers
  const handleSearchOpen = useCallback(() => setIsSearchModalOpen(true), [])
  const handleSearchClose = useCallback(() => setIsSearchModalOpen(false), [])
  const handleMobileMenuToggle = useCallback(() => setIsMobileMenuOpen((prev) => !prev), [])
  const handleSignIn = useCallback(() => {
    router.push("/api/auth/signin")
  }, [router])

  const handleSearchResult = useCallback(
    (url: string) => {
      router.push(url)
      handleSearchClose()
    },
    [router, handleSearchClose],
  )

  const isPremium = useMemo(() => subscriptionPlan && subscriptionPlan !== "FREE", [subscriptionPlan])

  // Animation variants (simplified)
  const navbarVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }

  const mobileMenuVariants = {
    hidden: { opacity: 0, x: "100%" },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      opacity: 0,
      x: "100%",
      transition: { duration: 0.2, ease: "easeIn" },
    },
  }

  // Credits Display Component
  const CreditsDisplay = useMemo(() => {
    if (!isAuthenticated) return null

    if (availableCredits === null) {
      return (
        <div className="hidden lg:flex items-center space-x-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      )
    }

    const isLowCredits = availableCredits < 100

    return (
      <div
        className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-muted/50 rounded-lg border transition-colors hover:bg-muted/70"
        data-testid="credits-display"
      >
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            isLowCredits ? "text-destructive" : "text-foreground",
          )}
        >
          {availableCredits.toLocaleString()}
        </span>
        {isPremium && (
          <Badge variant="secondary" className="text-xs font-medium ml-2 px-2 py-0.5">
            <Sparkles className="h-3 w-3 mr-1" />
            {subscriptionPlan}
          </Badge>
        )}
      </div>
    )
  }, [isAuthenticated, availableCredits, subscriptionPlan, isPremium])

  // User Avatar Component
  const UserAvatar = useMemo(
    () => (
      <Avatar className="h-8 w-8 border border-border transition-all duration-200 hover:border-primary/50">
        <AvatarImage src={(user as any)?.image || ""} alt={user?.name || "User"} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    ),
    [user, userInitials],
  )

  return (
    <>
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[1000] focus-visible:bg-background focus-visible:border focus-visible:rounded-lg px-4 py-2 shadow-lg font-medium"
      >
        Skip to content
      </a>

      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg border-border/60"
            : "bg-background/80 backdrop-blur-sm border-border/40",
        )}
        data-testid="main-navbar"
        role="navigation"
        aria-label="Main navigation"
        initial="hidden"
        animate="visible"
        variants={!prefersReducedMotion ? navbarVariants : {}}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          {/* Logo */}
          <Link
            href="/"
            aria-label="Return to homepage"
            className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-lg"
          >
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-1"
            data-testid="nav-items"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                    isActive
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                  data-testid={`nav-item-${item.name.toLowerCase()}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            
            {/* Credits Display */}
            {CreditsDisplay}

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open search (Press / or Ctrl/Cmd+K)"
              title="Search — press / or Ctrl/Cmd+K"
              aria-expanded={isSearchModalOpen}
              onClick={handleSearchOpen}
              className="h-9 w-9 rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <CourseNotificationsMenu />
                <NotificationsMenu />
                <UserMenu>{UserAvatar}</UserMenu>
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                size="sm"
              >
                Sign in
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Open menu"
                  aria-controls="main-mobile-menu"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isMobileMenuOpen ? "close" : "open"}
                      initial={!prefersReducedMotion ? { rotate: -90, opacity: 0 } : {}}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={!prefersReducedMotion ? { rotate: 90, opacity: 0 } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </SheetTrigger>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <SheetContent
                    id="main-mobile-menu"
                    side="right"
                    className="w-72 sm:w-80 p-0 bg-background border-l"
                  >
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={!prefersReducedMotion ? mobileMenuVariants : {}}
                      className="h-full flex flex-col"
                    >
                      {/* Mobile Header */}
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <Logo />
                          <ThemeToggle />
                        </div>
                      </div>

                      {/* Mobile Navigation */}
                      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                          const isActive = pathname === item.href

                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "block px-3 py-2 text-base font-medium rounded-lg transition-colors",
                                isActive
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                              )}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {item.name}
                            </Link>
                          )
                        })}
                      </nav>

                      {/* Mobile Footer */}
                      <div className="p-4 border-t space-y-3">
                        {isAuthenticated ? (
                          <>
                            {availableCredits !== null && (
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Credits</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium tabular-nums">
                                    {availableCredits.toLocaleString()}
                                  </span>
                                  {isPremium && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                      {subscriptionPlan}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            <UserMenu>
                              <Button variant="outline" className="w-full justify-start">
                                {UserAvatar}
                                <span className="ml-2">Account</span>
                              </Button>
                            </UserMenu>
                          </>
                        ) : (
                          <Button className="w-full" onClick={handleSignIn}>
                            Sign in
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </SheetContent>
                )}
              </AnimatePresence>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
    </>
  )
}