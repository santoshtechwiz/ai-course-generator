"use client"

import { useState, useEffect, useCallback, memo, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, Search } from "lucide-react"
import { motion } from "framer-motion"
import { navItems } from "@/constants/navItems"

import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"

import { useAuth } from "@/hooks/use-auth"
import MobileMenu from "@/components/layout/navigation/MobileMenu"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import useSubscription from "@/hooks/use-subscription"

// NavItems component with proper memoization
const NavItems = memo(() => {
  const pathname = usePathname()

  // Use useMemo to prevent unnecessary recalculations
  const currentPath = useMemo(() => pathname || "", [pathname])

  return (
    <nav className="mx-6 hidden items-center space-x-8 md:flex">
      {navItems.map((item) => (
        <Link href={item.href} passHref key={item.name}>
          <motion.div
            className={`relative py-2 text-sm font-medium transition-colors ${
              currentPath === item.href ? "text-primary font-semibold" : "text-foreground hover:text-primary/80"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {item.name}
            {currentPath === item.href && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            {item.subItems && item.subItems.length > 0 && <ChevronDown className="inline h-3 w-3 ml-1" />}
          </motion.div>
        </Link>
      ))}
    </nav>
  )
})
NavItems.displayName = "NavItems"

// Simple debounce function
function debounce(fn: Function, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { user, isAuthenticated } = useAuth()
  const {
    isSubscribed,
    totalTokens,
    tokenUsage,
    subscriptionPlan,
    isLoading: isSubscriptionLoading,
  } = useSubscription()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Memoize derived values to prevent unnecessary re-renders
  const currentPath = useMemo(() => pathname || "", [pathname])
  const creditScore = useMemo(() => totalTokens || user?.credits || 0, [totalTokens, user?.credits])
  const showLoading = useMemo(
    () => isInitialLoad && isSubscriptionLoading && isAuthenticated,
    [isInitialLoad, isSubscriptionLoading, isAuthenticated],
  )

  // Scroll handler with proper debouncing
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  // Add scroll listener with cleanup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const debouncedScroll = debounce(handleScroll, 10)
      window.addEventListener("scroll", debouncedScroll, { passive: true })
      return () => window.removeEventListener("scroll", debouncedScroll)
    }
  }, [handleScroll])

  // Set initial load timeout
  useEffect(() => {
    if (!isAuthenticated) {
      setIsInitialLoad(false) // Ensure state is updated correctly when not authenticated
      return
    }

    const initialLoadTimer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 3000)

    return () => {
      clearTimeout(initialLoadTimer)
    }
  }, [isAuthenticated]) // Ensure dependency array only includes `isAuthenticated`

  // Handle search modal - memoize to prevent unnecessary re-renders
  const handleSearchOpen = useCallback(() => {
    setIsSearchModalOpen(true)
  }, [])

  const handleResultClick = useCallback(
    (url: string) => {
      router.push(url)
      setIsSearchModalOpen(false)
    },
    [router],
  )

  // Animation variants - memoize to prevent recreation on each render
  const headerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: -20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      },
    }),
    [],
  )

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled ? "bg-background/95 shadow-sm" : "bg-background/80"
      } backdrop-blur-sm border-b transition-all duration-300`}
      initial="hidden"
      animate="visible"
      variants={headerVariants}
    >
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Logo />

        {/* Navigation links */}
        <NavItems />

        <div className="flex items-center ml-auto space-x-4">
          {/* Credit display for authenticated users */}
          {isAuthenticated && !showLoading && (
            <div className="hidden md:flex items-center space-x-1">
              <motion.div
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Credits: {creditScore - tokenUsage}
              </motion.div>
              {subscriptionPlan !== "FREE" && (
                <motion.span
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {subscriptionPlan}
                </motion.span>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {showLoading && (
            <div className="hidden md:flex items-center">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          )}

          {/* Search button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchOpen}
            className="relative h-8 w-8 rounded-full"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Search Modal */}
          <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleResultClick} />

          <ThemeToggle />

          {session && <NotificationsMenu />}

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </motion.header>
  )
}
