"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Loader2, Sparkles } from "lucide-react"
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
import { CreditCounter } from "@/components/shared/CreditCounter"

const SearchModal = lazy(() => import("@/components/layout/navigation/SearchModal"))
const NotificationsMenu = lazy(() => import("@/components/Navbar/NotificationsMenu"))

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  
  const {
    user,
    isAuthenticated,
    credits,
    tokensUsed,
    remainingCredits,
    plan,
    isLoading,
  } = useAuth()

  const totalTokens = credits || 0
  const subscriptionPlan = plan || "FREE"
  
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
  }, [isAuthenticated, subscriptionPlan])

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHoveringLogo, setIsHoveringLogo] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const desktopNavItems = useMemo(() => 
    navItems.map((item) => {
      const active = pathname === item.href
      return (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "relative px-5 py-2.5 text-sm font-black uppercase tracking-wider transition-all duration-150",
            "border-6 rounded-none",
            active 
              ? "border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[4px_4px_0_var(--shadow-color)]" 
              : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--shadow-color)]",
            "hover:translate-x-[-1px] hover:translate-y-[-1px]",
            "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]"
          )}
        >
          {item.name}
        </Link>
      )
    }),
    [pathname]
  )

  const mobileNavItems = useMemo(() =>
    navItems.map((item) => {
      const active = pathname === item.href
      return (
        <Link
          key={item.name}
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "block px-5 py-4 min-h-[56px] flex items-center font-black uppercase tracking-wider border-6 rounded-none",
            "transition-all duration-150",
            active 
              ? "bg-[var(--color-primary)] text-white border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)]" 
              : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--shadow-color)]",
            "hover:translate-x-[-1px] hover:translate-y-[-1px]",
            "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]"
          )}
        >
          {item.name}
        </Link>
      )
    }),
    [pathname]
  )

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-[60]",
          "bg-[var(--color-bg)] border-b-6 border-[var(--color-border)] shadow-neo",
          "transition-all duration-200 neo-typography-body"
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          duration: 0.3
        }}
      >
        <div className="container flex h-16 items-center justify-between px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link 
              href="/" 
              aria-label="Home"
              className="block"
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
            >
              <motion.div
                animate={{ rotate: isHoveringLogo ? [-2, 2, -2, 2, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Logo />
              </motion.div>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {desktopNavItems}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Credit counter */}
            {isAuthenticated && !isLoading && (
              <motion.div 
                className="hidden sm:flex items-center gap-1"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <CreditCounter />
                {availableCredits < 100 && availableCredits > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Search Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                onClick={() => setIsSearchModalOpen(true)}
                className="h-10 w-10 border-6 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)] transition-all duration-150"
              >
                <Search className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              className="hidden sm:block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThemeToggle />
            </motion.div>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Suspense fallback={
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-5 w-5" />
                  </motion.div>
                }>
                  <NotificationsMenu />
                </Suspense>
                <UserMenu />
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handleSignIn}
                  className="hidden sm:flex font-black uppercase tracking-wider min-h-[40px] px-6 border-6 border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 rounded-none"
                  size="sm"
                >
                  Sign in
                </Button>
              </motion.div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild suppressHydrationWarning>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden h-10 w-10 border-6 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)] transition-all duration-150"
                    suppressHydrationWarning
                    aria-label="Toggle menu"
                  >
                    <motion.div
                      animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </motion.div>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[85vw] max-w-sm p-0 bg-[var(--color-bg)] border-r-6 border-[var(--color-border)] shadow-[6px_0px_0px_0px_var(--shadow-color)] rounded-none"
              >
                <motion.div 
                  className="h-full flex flex-col"
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Header */}
                  <div className="p-4 border-b-6 border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]">
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Logo />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <ThemeToggle />
                    </motion.div>
                  </div>
                  
                  {/* Navigation */}
                  <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {mobileNavItems}
                  </nav>
                  
                  {/* Footer */}
                  <div className="p-4 border-t-6 border-[var(--color-border)] space-y-3 bg-[var(--color-bg)]">
                    {isAuthenticated ? (
                      <>
                        {availableCredits !== null && (
                          <motion.div 
                            className="flex items-center justify-between p-4 bg-[var(--color-card)] border-6 border-[var(--color-border)] rounded-none shadow-[4px_4px_0_var(--shadow-color)]"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-5 w-5" />
                              <span className="text-sm font-black uppercase">Credits</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-black tabular-nums">
                                {availableCredits.toLocaleString()}
                              </span>
                              {subscriptionPlan !== "FREE" && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1 border-3 border-[var(--color-border)] font-black shadow-[2px_2px_0_var(--shadow-color)] rounded-none uppercase"
                                >
                                  {subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                        <div className="flex gap-2 md:hidden">
                          <Suspense fallback={
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-5 w-5" />
                            </motion.div>
                          }>
                            <NotificationsMenu />
                          </Suspense>
                        </div>
                      </>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className="w-full min-h-[56px] font-black uppercase tracking-wider border-6 border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 rounded-none"
                          onClick={() => {
                            handleSignIn()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          Sign in
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
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