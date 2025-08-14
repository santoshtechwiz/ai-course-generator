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
import { cn } from "@/lib/utils"
import { AsyncNavLink } from "@/components/loaders/AsyncNavLink"
import { useGlobalLoader } from '@/store/loaders/global-loader'

import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion"
import Logo from "@/components/shared/Logo"


export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const subscription = useSubscription()
  const { startLoading } = useGlobalLoader()
  
  // Extract subscription details
  const totalTokens = user?.credits || 0
  const tokenUsage = 0 // TODO: Track token usage
  const subscriptionPlan = subscription?.subscription.plan || 'FREE'
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
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable
      // Cmd/Ctrl+K opens search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchModalOpen(true)
        return
      }
      // / quick search if not typing
      if (!isTyping && e.key === '/') {
        e.preventDefault()
        setIsSearchModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      } 
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }
  
  const mobileMenuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    exit: {
      x: "100%", 
      opacity: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }

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
    if (!authLoading) {
      const timer = setTimeout(() => setReady(true), 100)
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
  }, [user?.name])

  // Handlers
  const handleSearchOpen = useCallback(() => setIsSearchModalOpen(true), [])
  const handleSearchClose = useCallback(() => setIsSearchModalOpen(false), [])
  const handleMobileMenuToggle = useCallback(() => setIsMobileMenuOpen((prev) => !prev), [])
  const handleSignIn = useCallback(() => {
    startLoading({ message: "Redirecting to sign in..." });
    router.push("/api/auth/signin")
  }, [router, startLoading])

  const handleSearchResult = useCallback(
    (url: string) => {
      startLoading({ message: "Loading page..." });
      router.push(url)
      handleSearchClose()
    },
    [router, handleSearchClose, startLoading],
  )

  // Navigation items with active state and animations
  const navigationItems = useMemo(
    () =>
      navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon || (() => null)
        
        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="relative"
          >
            <AsyncNavLink
              href={item.href}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors group block rounded-md whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "hover:bg-accent/60",
                isActive 
                  ? "text-primary bg-accent/60 border border-border/50" 
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-testid={`nav-item-${item.name.toLowerCase()}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1 rounded-md",
                  isActive ? "bg-accent/80" : "group-hover:bg-accent/60"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                </div>
                <span className="font-medium whitespace-nowrap">{item.name}</span>
              </div>
              {/* Minimal active underline */}
              {isActive && <span className="absolute left-4 right-4 bottom-1 h-[2px] bg-primary/60" />}
            </AsyncNavLink>
          </motion.div>
        )
      }),
    [pathname, itemVariants],
  )

  // Mobile navigation items with animations and icons
  const mobileNavigationItems = useMemo(
    () => navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon || (() => null)
        
        return (
          <motion.div key={item.name} variants={itemVariants}>
            <AsyncNavLink
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-lg whitespace-nowrap",
                "hover:bg-accent/80",
                isActive 
                  ? "text-primary bg-primary/5 border-l-2 border-primary" 
                  : "text-muted-foreground border-l-2 border-transparent hover:border-primary/40",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "p-2 rounded-md",
                isActive ? "bg-primary/10" : "bg-muted/50"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              {item.name}
            </AsyncNavLink>
          </motion.div>
        )
      }),
    [pathname, itemVariants, setIsMobileMenuOpen],
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
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-card border rounded-lg shadow-sm whitespace-nowrap">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span
            className={cn("text-sm font-medium tabular-nums", isLowCredits ? "text-destructive" : "text-foreground")}
          >
            <AnimatedNumber value={availableCredits} />
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

  const isPremium = useMemo(() => subscriptionPlan && subscriptionPlan !== "FREE", [subscriptionPlan])

  // User avatar component
  const UserAvatar = useMemo(
    () => (
      <Avatar className="h-8 w-8 border-2 border-border/50 hover:border-primary/50 transition-all duration-200">
        <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
      </Avatar>
    ),
    [user?.avatarUrl, user?.name, userInitials],  )

  function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState<number>(value)
    useEffect(() => {
      if (typeof value !== "number") return
      const startValue = display
      const endValue = value
      if (startValue === endValue) return
      const durationMs = 500
      const startAt = performance.now()
      let raf = 0
      const step = (now: number) => {
        const t = Math.min(1, (now - startAt) / durationMs)
        const current = Math.round(startValue + (endValue - startValue) * t)
        setDisplay(current)
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }, [value])
    return <>{Number.isFinite(display) ? display.toLocaleString() : "0"}</>
  }
  
  return (
    <>
      {/* Skip to content for accessibility */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:bg-background focus:border focus:rounded px-3 py-1 shadow">
        Skip to content
      </a>
      <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 relative",
          "border-b border-border/60 bg-gradient-to-b from-background/80 via-background/70 to-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
          "backdrop-saturate-150",
          scrolled && "bg-background/90",
        )}
        data-testid="main-navbar"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Top hairline highlight */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 h-px -z-10"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: scrolled ? 0.35 : 0.25 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </motion.div>
        {/* Background subtle gradient glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: scrolled ? 0.35 : 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-full w-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        </motion.div>
        {/* Radial highlight for glass effect */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -z-10 left-1/2 top-0 h-32 w-[80vw] -translate-x-1/2"
          initial={{ opacity: 0.15, y: -8 }}
          animate={{ opacity: scrolled ? 0.25 : 0.18, y: scrolled ? 0 : -4 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-full w-full opacity-70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-primary/0 to-transparent" />
        </motion.div>
        {/* Subtle shimmer indicator on scroll (reduced motion aware) */}
        {!prefersReducedMotion && scrolled && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 h-0.5 w-24 -z-10"
            initial={{ x: "-10%", opacity: 0.0 }}
            animate={{ x: ["-10%", "110%"], opacity: [0.0, 0.3, 0.0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </motion.div>
        )}
        <motion.div 
          className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl"
          initial="hidden"
          animate="visible"
          variants={navbarVariants}
        >
          {/* Logo */}
          <motion.div 
            className="flex items-center" 
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 0.2 }}
            whileTap={{ scale: 0.98 }}
          >
            <AsyncNavLink href="/" aria-label="Return to homepage">
              <Logo />
            </AsyncNavLink>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.nav 
            className="hidden md:flex items-center space-x-3" 
            data-testid="nav-items"
            variants={itemVariants}
            aria-label="Primary navigation"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon || (() => null)
              return (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  className="relative"
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <AsyncNavLink
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2.5 text-sm font-medium transition-colors group block rounded-md whitespace-nowrap",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "hover:bg-accent/60",
                      isActive 
                        ? "text-primary bg-accent/60 border border-border/50" 
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    data-testid={`nav-item-${item.name.toLowerCase()}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="navActivePill"
                        className="absolute inset-0 -z-10 rounded-md bg-primary/5 border border-border/50"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1 rounded-md",
                        isActive ? "bg-accent/80" : "group-hover:bg-accent/60"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      </div>
                      <span className="font-medium whitespace-nowrap">{item.name}</span>
                    </div>
                    {isActive && <span className="absolute left-4 right-4 bottom-1 h-[2px] bg-primary/60" />}
                    <span className="pointer-events-none absolute left-4 right-4 bottom-1 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </AsyncNavLink>
                </motion.div>
              )
            })}
          </motion.nav>

          {/* Right Section */}
          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3"
            variants={itemVariants}
          >
            {/* Credits Display */}
            {CreditsDisplay}

            {/* Upgrade CTA (non-premium) */}
            {!isPremium && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow hover:shadow-md">
                  <a href="/dashboard/subscription" aria-label="Upgrade your plan to unlock premium features">Upgrade</a>
                </Button>
              </motion.div>
            )}

            {/* Search Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchOpen}
                className="h-9 w-9 hover:bg-accent/80 transition-all duration-200 relative overflow-hidden group"
                aria-label="Open search"
                data-testid="search-button"
              >
                <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span className="sr-only">Open search</span>
              </Button>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <div className="relative overflow-hidden rounded-md">
                <ThemeToggle />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />
              </div>
            </motion.div>

            {/* Notifications - Desktop Only */}
            {isAuthenticated && (
              <motion.div
                className={cn(
                  "hidden sm:block transition-all duration-300",
                  ready ? "opacity-100 scale-100" : "opacity-0 scale-95",
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NotificationsMenu />
              </motion.div>
            )}

            {/* User Menu */}
            <motion.div 
              className={cn("transition-all duration-300", ready ? "opacity-100 scale-100" : "opacity-0 scale-95")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserMenu />
            </motion.div>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <motion.div
                  className="md:hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9" 
                    aria-label="Open navigation menu"
                    aria-haspopup="dialog"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-menu"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-80 sm:w-96 p-0 overflow-hidden"
                role="dialog"
                aria-label="Navigation"
              >
                <AnimatePresence>
                  <motion.div 
                    className="flex flex-col h-full"
                    variants={mobileMenuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    id="mobile-menu"
                  >
                    {/* Mobile Header */}
                    <motion.div 
                      className="flex items-center justify-between p-4 border-b"
                      variants={itemVariants}
                    >
                      <Logo />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="h-8 w-8 hover:bg-accent/80 transition-colors"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close navigation menu</span>
                      </Button>
                    </motion.div>

                    {/* Mobile User Section */}
                    {isAuthenticated && (
                      <motion.div 
                        className="py-4 px-4 border-b"
                        variants={itemVariants}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {UserAvatar}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                        </div>

                        {/* Mobile Credits */}
                        {availableCredits !== null && (
                          <motion.div 
                            className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Credits</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold tabular-nums">
                                <AnimatedNumber value={availableCredits} />
                              </span>
                              {subscriptionPlan && subscriptionPlan !== "FREE" && (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Mobile Navigation */}
                    <motion.nav 
                      className="flex-1 py-4 space-y-1 overflow-y-auto px-3"
                      variants={itemVariants}
                      aria-label="Mobile navigation"
                    >
                      {mobileNavigationItems}
                    </motion.nav>

                    {/* Mobile Footer */}
                    <motion.div 
                      className="p-4 border-t space-y-3"
                      variants={itemVariants}
                    >
                      {/* Upgrade CTA (mobile) */}
                      {!isPremium && (
                        <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow hover:shadow-md" size="lg">
                          <a href="/dashboard/subscription">Upgrade</a>
                        </Button>
                      )}

                      {/* Mobile Notifications */}
                      {isAuthenticated && (
                        <div className="flex items-center justify-center">
                          <NotificationsMenu />
                        </div>
                      )}

                      {/* Mobile Sign In */}
                      {!isAuthenticated && !authLoading && (
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Button 
                            onClick={handleSignIn} 
                            className="w-full shadow-sm hover:shadow-md transition-all duration-200" 
                            size="lg"
                            aria-label="Sign in to your account"
                          >
                            Sign in
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </SheetContent>
            </Sheet>
          </motion.div>
        </motion.div>
        {/* Animated bottom border accent */}
        <motion.div 
          className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" 
          initial={{ scaleX: 0, opacity: 0 }} 
          animate={{ scaleX: scrolled ? 1 : 0, opacity: scrolled ? 1 : 0 }} 
          transition={{ duration: 0.5 }} 
          style={{ transformOrigin: 'left' }}
        />
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
      </MotionConfig>
    </>
  )
}
