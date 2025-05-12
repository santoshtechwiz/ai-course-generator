"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Search, LogIn, User, LogOut, Menu, ChevronDown, Crown, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { navItems } from "@/constants/navItems"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"

import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/store/subscription-provider"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import SearchModal from "@/components/Navbar/SearchModal"
import Logo from "@/components/Navbar/Logo"

// NavItems component with proper memoization
const NavItems = memo(() => {
  const [currentPath, setCurrentPath] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    setCurrentPath(pathname || "")
  }, [pathname])

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

export default function MainNavbar() {
  // Use Redux-based auth hook
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

  // Use Redux-based subscription hook
  const { subscription, isLoading: subscriptionLoading } = useSubscription()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentPath, setCurrentPath] = useState("")
  const pathname = usePathname()
  const [creditScore, setCreditScore] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Extract user data from Redux auth state
  const isAdmin = user?.isAdmin || false
  const userName = user?.name || ""
  const userEmail = user?.email || ""

  // Scroll handler with proper debouncing
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  // Update pathname in useEffect
  useEffect(() => {
    setCurrentPath(pathname || "")
  }, [pathname])

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
    if (!isAuthenticated) return

    const initialLoadTimer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 3000)

    return () => {
      clearTimeout(initialLoadTimer)
    }
  }, [isAuthenticated])

  // Update credit score from subscription data
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (subscription?.data?.credits !== undefined) {
        setCreditScore(subscription.data.credits)
      } else if (user?.credits !== undefined) {
        setCreditScore(user.credits)
      }
    }, 100)

    return () => clearTimeout(debounceTimer)
  }, [subscription?.data?.credits, user?.credits])

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  }

  // Determine subscription plan from Redux state
  const subscriptionPlan = subscription?.data?.currentPlan || "FREE"
  const showLoading = isInitialLoad && subscriptionLoading && isAuthenticated

  // Simple debounce function
  function debounce(fn: Function, ms = 300) {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (this: any, ...args: any[]) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
  }

  return (
    <motion.header
      className={`fixed top-0 z-[1000] w-full border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 transition-all duration-300 ${
        scrolled ? "shadow-sm border-border/80" : "border-transparent"
      }`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" passHref>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="cursor-pointer"
            >
              <Logo />
            </motion.div>
          </Link>
          <NavItems />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchModalOpen(true)}
              className="rounded-full hover:bg-accent hover:text-accent-foreground"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </motion.div>

          {isAuthenticated &&
            (showLoading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <NotificationsMenu initialCount={creditScore} />
              </motion.div>
            ))}

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ThemeToggle />
          </motion.div>

          {isAuthenticated ? (
            showLoading ? (
              <Button variant="ghost" size="icon" className="rounded-full">
                <Loader2 className="h-5 w-5 animate-spin" />
              </Button>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-xl p-2 shadow-lg">
                    <div className="p-2 space-y-1">
                      {subscriptionLoading ? (
                        <>
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-4 w-32" />
                        </>
                      ) : (
                        <>
                          <p className="font-medium truncate">{userName}</p>
                          <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                        </>
                      )}
                      {subscriptionLoading ? (
                        <Skeleton className="h-5 w-16 mt-1" />
                      ) : (
                        subscriptionPlan && <Badge className="mt-1">{subscriptionPlan}</Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/admin" className="cursor-pointer">
                          <Crown className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/account" className="cursor-pointer">
                        <Crown className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button variant="default" onClick={() => signIn()} className="hidden md:flex rounded-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isSearchModalOpen && (
          <SearchModal
            isOpen={isSearchModalOpen}
            setIsOpen={setIsSearchModalOpen}
            onResultClick={() => {
              setIsSearchModalOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[300px] p-0 border-r backdrop-blur-lg transition-all duration-300"
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex justify-between items-center">
              <Logo size="small" />
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4">
            <nav className="space-y-2">
              {navItems.map((item, index) => (
                <SheetClose asChild key={item.name}>
                  <Link href={item.href} passHref>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`py-2 text-sm font-medium ${
                        currentPath === item.href
                          ? "text-primary font-semibold"
                          : "text-foreground hover:text-primary/80"
                      }`}
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                </SheetClose>
              ))}
            </nav>

            <div className="pt-4 border-t">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <motion.div
                    className="p-2 rounded-lg bg-accent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {subscriptionLoading ? (
                      <>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </>
                    ) : (
                      <>
                        <p className="font-medium truncate">{userName}</p>
                        <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                        {subscriptionPlan && <Badge className="mt-1">{subscriptionPlan}</Badge>}
                      </>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      signIn()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}
