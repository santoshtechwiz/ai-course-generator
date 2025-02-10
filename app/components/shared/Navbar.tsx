"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Search, LogIn, User, Crown, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { navItems } from "@/constants/navItems"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import SearchModal from "./SearchModal"
import { Badge } from "@/components/ui/badge"
import MobileMenu from "./MobileMenu"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { UserMenu } from "./UserMenu"

const NavItems = () => {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <motion.div
          key={item.name}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="link"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === item.href ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => router.push(item.href)}
          >
            {item.name}
          </Button>
        </motion.div>
      ))}
    </nav>
  )
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
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
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE"
    return <Badge variant={plan === "PRO" ? "default" : plan === "BASIC" ? "secondary" : "outline"}>{plan}</Badge>
  }

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        scrolled ? "shadow-sm" : ""
      }`}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <MobileMenu />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Logo />
          </motion.div>
        </div>

        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <NavItems />
        </nav>

        <div className="flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchModalOpen(true)}>
              <Search className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Search</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <NotificationsMenu initialCount={subscriptionStatus?.credits ?? 0} />
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ThemeToggle />
          </motion.div>

          {status === "authenticated" ? (
            <UserMenu>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  {session?.user?.name && <p className="font-medium">{session.user.name}</p>}
                  {session?.user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                  )}
                  {getSubscriptionBadge()}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/subscription" className="flex items-center">
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </UserMenu>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="secondary" size="sm" onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </motion.div>
          )}
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
    </motion.header>
  )
}