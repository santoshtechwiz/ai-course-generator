"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import { Search, LogIn, User, LogOut, Menu, ChevronDown, Crown, X } from "lucide-react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Button } from "@/components/ui/button"

import { navItems } from "@/constants/navItems"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import SearchModal from "./SearchModal"
import { Badge } from "@/components/ui/badge"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { UserMenu } from "./UserMenu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { ThemeToggle } from "../ThemeToggle"

const NavItems = () => {
  const pathname = usePathname()

  return (
    <nav className="mx-6 hidden items-center space-x-4 md:flex">
      {navItems.map((item) => (
        <motion.div
          key={item.name}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link href={item.href} passHref>
            <Button
              variant={pathname === item.href ? "default" : "ghost"}
              className={`relative flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <LayoutGroup>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                {item.subItems.length > 0 && <ChevronDown className="h-3 w-3 ml-1.5" />}

                {pathname === item.href && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </LayoutGroup>
            </Button>
          </Link>
        </motion.div>
      ))}
    </nav>
  )
}

export default function MainNavbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { subscriptionStatus, isLoading: isLoadingSubscription, refreshSubscription } = useSubscriptionStore()
  const pathname = usePathname()
  const [creditScore, setCreditScore] = useState(0)

  // Scroll handler with debounce
  const handleScroll = useCallback(() => {
    let timer: NodeJS.Timeout
    return () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        setScrolled(window.scrollY > 20)
      }, 10)
    }
  }, [])

  useEffect(() => {
    refreshSubscription()
    const intervalId = setInterval(refreshSubscription, 60000)
    return () => clearInterval(intervalId)
  }, [refreshSubscription])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll())
    return () => window.removeEventListener("scroll", handleScroll())
  }, [handleScroll])

  useEffect(() => {
    if (subscriptionStatus?.credits !== undefined) {
      setCreditScore(subscriptionStatus.credits)
    }
  }, [subscriptionStatus])

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.header
      className={`fixed top-0 z-[1000] w-full border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 transition-all duration-300 ${
        scrolled ? "shadow-sm border-border/80" : "border-transparent"
      }`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className="w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between"
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div className="flex items-center" variants={itemVariants}>
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
        </motion.div>

        <motion.div className="flex items-center gap-2 md:gap-4" variants={itemVariants}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button variant="ghost" size="icon" onClick={() => setIsSearchModalOpen(true)} className="rounded-full">
              <Search className="h-4 w-4" />
            </Button>
          </motion.div>

          <NotificationsMenu initialCount={creditScore} />

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ThemeToggle />
          </motion.div>

          {status === "authenticated" ? (
            <UserMenu>
              <DropdownMenuContent className="w-56 rounded-xl p-2 shadow-lg">
                <div className="p-2 space-y-1">
                  <p className="font-medium truncate">{session.user?.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{session.user?.email}</p>
                  {subscriptionStatus && <Badge className="mt-1">{subscriptionStatus.subscriptionPlan}</Badge>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {session.user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                {session.user && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/account" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </UserMenu>
          ) : (
            <Button variant="default" onClick={() => signIn()} className="hidden md:flex rounded-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isSearchModalOpen && (
          <SearchModal
            isOpen={isSearchModalOpen}
            setIsOpen={setIsSearchModalOpen}
            onResultClick={(url) => {
              setIsSearchModalOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[300px] p-0 border-r backdrop-blur-lg"
          onInteractOutside={(e) => e.preventDefault()}
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
              {navItems.map((item) => (
                <SheetClose asChild key={item.name}>
                  <Link href={item.href} passHref>
                    <Button variant="ghost" className="w-full justify-start">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                </SheetClose>
              ))}
            </nav>

            <div className="pt-4 border-t">
              {status === "authenticated" ? (
                <div className="space-y-4">
                  <div className="p-2 rounded-lg bg-accent">
                    <p className="font-medium truncate">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}
