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
import { useGlobalLoader } from '@/store/global-loader'

import { motion, AnimatePresence } from "framer-motion"
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
  )  // Navigation items with active state and animations
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
                "relative px-3 py-2 text-sm font-medium transition-colors group block",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              data-testid={`nav-item-${item.name.toLowerCase()}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </div>
              <div className="relative mt-0.5">
                {isActive ? (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full w-full" 
                    layoutId="activeNavIndicator"
                    transition={{ duration: 0.2, type: "spring" }}
                  />
                ) : (
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary/30 rounded-full group-hover:w-full transition-all duration-300" />
                )}
              </div>
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
                "flex items-center gap-3 px-4 py-3.5 text-base font-medium transition-all duration-200 rounded-lg",
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
        <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
      </Avatar>
    ),
    [user?.avatarUrl, user?.name, userInitials],  )
  
  return (
    <>      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          "border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
          scrolled && "shadow-sm bg-background/95 supports-[backdrop-filter]:bg-background/80",
        )}
        data-testid="main-navbar"
        role="navigation"
        aria-label="Main navigation"
      >
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
            whileHover={{ scale: 1.05 }}
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
            {navigationItems}
          </motion.nav>

          {/* Right Section */}
          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3"
            variants={itemVariants}
          >
            {/* Credits Display */}
            {CreditsDisplay}

            {/* Search Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchOpen}
                className="h-9 w-9 hover:bg-accent/80 transition-all duration-200 relative overflow-hidden group"
                aria-label="Search"
                data-testid="search-button"
              >
                <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span className="sr-only">Search</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
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
            )}            {/* User Menu or Sign In Button */}
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
                        aria-label="Close menu"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close menu</span>
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
                                {availableCredits.toLocaleString()}
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
                          >
                            Sign In
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </SheetContent>
            </Sheet>          </motion.div>
        </motion.div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
    </>
  )
}
