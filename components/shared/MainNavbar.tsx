"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Search, LogIn, User, LogOut, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { navItems } from "@/constants/navItems"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import SearchModal from "./SearchModal"
import { Badge } from "@/components/ui/badge"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { UserMenu } from "./UserMenu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const NavItems = () => {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="mx-6 hidden items-center space-x-4 md:flex">
      {navItems.map((item) => (
        <motion.div
          key={item.name}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            className="flex items-center space-x-2"
            onClick={() => router.push(item.href)}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Button>
        </motion.div>
      ))}
    </nav>
  )
}

export default function MainNavbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const { subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStore()

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const handleSignIn = () => signIn()
  const handleSignOut = async () => {
    const currentUrl = window.location.pathname
    await signOut({ callbackUrl: currentUrl })
  }

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription || !subscriptionStatus) return null
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE" | "ULTIMATE"
    return (
      <Badge
        variant={plan === "PRO" ? "default" : plan === "BASIC" ? "secondary" : "outline"}
        className="ml-2 animate-pulse"
      >
        {plan}
      </Badge>
    )
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        scrolled ? "shadow-md" : ""
      }`}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between px-4">
        <div className="flex items-center flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Logo />
          </motion.div>
          <NavItems />
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchModalOpen(true)}>
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          <NotificationsMenu initialCount={subscriptionStatus?.credits ?? 0} />
          <ThemeToggle />

          {status === "authenticated" ? (
            <UserMenu>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex flex-col space-y-1 p-2">
                  {session?.user?.name && <p className="font-medium">{session.user.name}</p>}
                  {session?.user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                  )}
                  {getSubscriptionBadge()}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </UserMenu>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
              <Button
                variant="default"
                size="sm"
                onClick={handleSignIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </motion.div>
          )}

          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isSearchModalOpen && (
          <SearchModal
            isOpen={isSearchModalOpen}
            setIsOpen={setIsSearchModalOpen}
            onResultClick={(url) => {
              router.push(url)
              setIsSearchModalOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  router.push(item.href)
                  setIsMobileMenuOpen(false)
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            ))}
            {status === "authenticated" ? (
              <>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    router.push("/dashboard")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                className="justify-start"
                onClick={() => {
                  handleSignIn()
                  setIsMobileMenuOpen(false)
                }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}
