"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
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

import { useAuth, useSubscription } from "@/modules/auth"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import CourseNotificationsMenu from "@/components/Navbar/CourseNotificationsMenu"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion"
import Logo from "@/components/shared/Logo"

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const subscription = useSubscription()
  // Route transitions handled by NProgress (legacy startLoading removed)

  // Extract subscription details
  const totalTokens = user?.credits || 0
  const tokenUsage = 0 // TODO: Track token usage
  const subscriptionPlan = subscription?.subscription.plan || "FREE"
  const isSubscriptionLoading = authLoading
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Keyboard shortcuts (Cmd/Ctrl+K, /)
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
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for smoother feel
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  }

  const mobileMenuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.04,
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
        when: "afterChildren",
        staggerChildren: 0.03,
        staggerDirection: -1,
      },
    },
  }

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          setScrolled(scrollY > 10) // Slightly higher threshold for better UX
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
    if (!authLoading) {
      const timer = setTimeout(() => setReady(true), 150) // Slightly longer for smoother load
      return () => clearTimeout(timer)
    }
  }, [authLoading])

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

  const navigationItems = useMemo(
    () =>
      navItems.map((item) => {
        const isActive = pathname === item.href

        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={item.href}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-all duration-300 group block rounded-lg whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                "hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]",
                isActive
                  ? "text-primary bg-primary/8 border border-primary/25 shadow-sm backdrop-blur-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/70 hover:border-accent/30 border border-transparent",
              )}
              data-testid={`nav-item-${item.name.toLowerCase()}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="font-medium whitespace-nowrap relative z-10">{item.name}</span>
              {/* Enhanced active indicator */}
              <motion.span
                layoutId="nav-underline"
                className={cn(
                  "absolute left-3 right-3 bottom-1 h-[2px] rounded-full",
                  isActive ? "bg-primary/80" : "bg-transparent group-hover:bg-primary/50",
                )}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              {/* Subtle glow effect for active state */}
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-primary/5 rounded-lg blur-sm -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          </motion.div>
        )
      }),
    [pathname, itemVariants],
  )

  const mobileNavigationItems = useMemo(
    () =>
      navItems.map((item) => {
        const isActive = pathname === item.href

        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            whileHover={{ x: 4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center px-4 py-4 text-base font-medium rounded-xl whitespace-nowrap transition-all duration-300",
                "hover:shadow-sm active:scale-[0.98]",
                isActive
                  ? "text-primary bg-primary/8 border-l-4 border-primary shadow-sm"
                  : "text-foreground/80 hover:text-foreground hover:bg-accent/80 border-l-4 border-transparent hover:border-primary/30",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -left-1 top-1/2 w-1 h-4 bg-primary rounded-full -translate-y-1/2"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </span>
            </Link>
          </motion.div>
        )
      }),
    [pathname, itemVariants, setIsMobileMenuOpen],
  )

  const CreditsDisplay = useMemo(() => {
    if (!isAuthenticated) return null

    if (availableCredits === null) {
      return (
        <div className="hidden lg:flex items-center space-x-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      )
    }

    const isLowCredits = availableCredits < 100
    const isPremium = subscriptionPlan && subscriptionPlan !== "FREE"

    return (
      <motion.div
        className="hidden lg:flex items-center space-x-2"
        data-testid="credits-display"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.div
          className="flex items-center space-x-2 px-3 py-2 bg-card/90 backdrop-blur-sm border rounded-lg shadow-sm whitespace-nowrap hover:shadow-md transition-all duration-300"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span
            className={cn(
              "text-sm font-semibold tabular-nums transition-colors duration-300",
              isLowCredits ? "text-destructive" : "text-foreground",
            )}
          >
            <AnimatedNumber value={availableCredits} />
          </span>
        </motion.div>
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Badge variant="secondary" className="text-xs font-medium hover:bg-secondary/80 transition-colors">
              <Sparkles className="h-3 w-3 mr-1" />
              {subscriptionPlan}
            </Badge>
          </motion.div>
        )}
      </motion.div>
    )
  }, [isAuthenticated, availableCredits, subscriptionPlan])

  const isPremium = useMemo(() => subscriptionPlan && subscriptionPlan !== "FREE", [subscriptionPlan])

  const UserAvatar = useMemo(
    () => (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Avatar className="h-8 w-8 border-2 border-border/50 hover:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-md">
          <AvatarImage src={(user as any)?.image || ""} alt={user?.name || "User"} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
        </Avatar>
      </motion.div>
    ),
    [user],
  )

  function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState<number>(value)
    useEffect(() => {
      if (typeof value !== "number") return
      const startValue = display
      const endValue = value
      if (startValue === endValue) return
      const durationMs = 800 // Slightly longer for smoother animation
      const startAt = performance.now()
      let raf = 0
      const step = (now: number) => {
        const t = Math.min(1, (now - startAt) / durationMs)
        // Use easeOutCubic for smoother number transitions
        const easedT = 1 - Math.pow(1 - t, 3)
        const current = Math.round(startValue + (endValue - startValue) * easedT)
        setDisplay(current)
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }, [value, display])
    return <>{Number.isFinite(display) ? display.toLocaleString() : "0"}</>
  }

  return (
    <>
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[1000] focus-visible:bg-background focus-visible:border focus-visible:rounded-lg px-4 py-2 shadow-lg font-medium"
      >
        Skip to content
      </a>

      <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
        <motion.header
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
            "border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
            scrolled && "bg-background/95 shadow-lg border-border/60 backdrop-blur-2xl",
          )}
          data-testid="main-navbar"
          role="navigation"
          aria-label="Main navigation"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
        >
      <motion.div
        className="container flex h-20 items-center justify-between px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={navbarVariants}
          >
            <motion.div
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/"
                aria-label="Return to homepage"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-lg"
              >
                <Logo />
              </Link>
            </motion.div>

            <motion.nav
              className="hidden lg:flex items-center space-x-6"
              data-testid="nav-items"
              variants={itemVariants}
              aria-label="Primary navigation"
            >
              {navigationItems}
            </motion.nav>

            <motion.div className="hidden md:flex items-center gap-6" variants={itemVariants}>
              {CreditsDisplay}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open search (Press / or Ctrl/Cmd+K)"
                  title="Search — press / or Ctrl/Cmd+K"
                  aria-expanded={isSearchModalOpen}
                  onClick={handleSearchOpen}
          className="p-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:shadow-sm"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>
              <ThemeToggle />
              {isAuthenticated ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <CourseNotificationsMenu />
                  <NotificationsMenu />
                  <UserMenu>{UserAvatar}</UserMenu>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSignIn}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    Sign in
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <motion.div className="flex md:hidden items-center gap-3" variants={itemVariants}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchOpen}
                  aria-label="Open search"
                  aria-expanded={isSearchModalOpen}
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open menu"
                      aria-controls="main-mobile-menu"
                      onClick={handleMobileMenuToggle}
                      className="p-2.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isMobileMenuOpen ? "close" : "open"}
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </SheetTrigger>
                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <SheetContent
                      id="main-mobile-menu"
                      side="right"
                      className="w-80 sm:w-96 p-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 border-l border-border/60"
                    >
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={mobileMenuVariants}
                        className="h-full flex flex-col"
                      >
                        <motion.div className="p-6 border-b border-border/60" variants={itemVariants}>
                          <div className="flex items-center justify-between">
                            <Logo />
                            <ThemeToggle />
                          </div>
                        </motion.div>
                        <motion.nav className="flex-1 p-4 space-y-2 overflow-y-auto" variants={itemVariants}>
                          {mobileNavigationItems}
                        </motion.nav>
                        <motion.div className="p-4 border-t border-border/60 space-y-3" variants={itemVariants}>
                          {isAuthenticated ? (
                            <>
                              {availableCredits !== null && (
                                <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                                  <div className="flex items-center space-x-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Credits</span>
                                  </div>
                                  <span className="text-sm font-semibold tabular-nums">
                                    <AnimatedNumber value={availableCredits} />
                                  </span>
                                </div>
                              )}
                              <UserMenu>
                                <Button variant="outline" className="w-full justify-start bg-transparent">
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
                        </motion.div>
                      </motion.div>
                    </SheetContent>
                  )}
                </AnimatePresence>
              </Sheet>
            </motion.div>
          </motion.div>
        </motion.header>
      </MotionConfig>

      <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
    </>
  )
}
