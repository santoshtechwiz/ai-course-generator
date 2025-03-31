"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Search, LogIn, User, LogOut, Menu, ChevronDown, Crown, X } from "lucide-react"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"

// Enhanced NavItems component with improved animations
const NavItems = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav className="mx-6 hidden items-center space-x-4 md:flex">
      {navItems.map((item) => (
        <motion.div
          key={item.name}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17,
          }}
        >
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            className={`relative flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            } overflow-hidden group`}
            onClick={() => router.push(item.href)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="ml-2">{item.name}</span>
              {item.subItems.length > 0 && (
                <ChevronDown className="h-3 w-3 ml-1.5 transition-transform duration-200 group-hover:rotate-180" />
              )}
            </motion.div>

            {pathname === item.href && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
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
  const pathname = usePathname()

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

  // Enhanced subscription badge with animations
  const getSubscriptionBadge = () => {
    if (isLoadingSubscription || !subscriptionStatus) return null
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE" | "ULTIMATE"

    // Enhanced badge styling based on plan
    const getBadgeStyles = () => {
      switch (plan) {
        case "PRO":
          return "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
        case "BASIC":
          return "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
        case "ULTIMATE":
          return "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm shadow-purple-500/20"
        default:
          return "bg-muted text-muted-foreground"
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        <Badge variant="outline" className={`ml-2 font-medium ${getBadgeStyles()} transition-all duration-300`}>
          {plan}
        </Badge>
      </motion.div>
    )
  }

  // Animation variants for the header
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  // Animation variants for header items
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  }

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        scrolled ? "shadow-md border-transparent" : ""
      }`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between px-4 sm:px-6">
        <motion.div className="flex items-center flex-shrink-0" variants={itemVariants}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Logo />
          </motion.div>
          <NavItems />
        </motion.div>

        <motion.div className="flex items-center gap-2 md:gap-4 flex-shrink-0" variants={itemVariants}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchModalOpen(true)}
              className="rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <NotificationsMenu initialCount={subscriptionStatus?.credits ?? 0} />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ThemeToggle />
          </motion.div>

          {status === "authenticated" ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <UserMenu>
                <DropdownMenuContent
                  className="w-56 rounded-xl p-2 shadow-lg border border-border/50 backdrop-blur-sm bg-background/95"
                  align="end"
                  forceMount
                  sideOffset={8}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col space-y-1.5 p-2"
                  >
                    {session?.user?.name && <p className="font-medium text-foreground">{session.user.name}</p>}
                    {session?.user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                    )}
                    {getSubscriptionBadge()}
                  </motion.div>

                  <DropdownMenuSeparator className="my-1" />

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-md py-1.5 transition-colors duration-200 focus:bg-accent"
                    >
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </motion.div>

                  <DropdownMenuSeparator className="my-1" />

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer rounded-md py-1.5 transition-colors duration-200 focus:bg-accent"
                    >
                      <Link href="/dashboard/account" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>
                  </motion.div>

                  {session.user?.isAdmin && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer rounded-md py-1.5 transition-colors duration-200 focus:bg-accent"
                      >
                        <Link href="/dashboard/admin" className="flex items-center">
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center cursor-pointer rounded-md text-destructive focus:text-destructive py-1.5 mt-1 transition-colors duration-200 focus:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuContent>
              </UserMenu>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:block"
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="default"
                size="sm"
                onClick={handleSignIn}
                className="rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span className="font-medium">Sign In</span>
              </Button>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="md:hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </motion.div>
        </motion.div>
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
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[350px] p-0 border-r border-border/50 backdrop-blur-sm bg-background/95"
        >
          <AnimatePresence>
            <motion.div
              className="flex flex-col h-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center justify-between">
                  <Logo size="small" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-full h-8 w-8 hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-auto py-4">
                <nav className="flex flex-col space-y-1 p-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className={`justify-start rounded-md w-full transition-all duration-200 ${
                            pathname === item.href
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => router.push(item.href)}
                        >
                          <item.icon className={`mr-2 h-4 w-4 ${pathname === item.href ? "text-primary" : ""}`} />
                          {item.name}
                          {item.subItems.length > 0 && <ChevronDown className="h-3 w-3 ml-auto" />}
                        </Button>
                      </SheetClose>
                    </motion.div>
                  ))}
                </nav>
              </div>

              <motion.div
                className="p-4 border-t mt-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.2 }}
              >
                {status === "authenticated" ? (
                  <div className="space-y-4">
                    <div className="flex items-center p-2 bg-accent/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium truncate">{session?.user?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{session?.user?.email}</p>
                      </div>
                      {getSubscriptionBadge()}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-center transition-all duration-300 hover:bg-accent"
                          onClick={() => router.push("/dashboard")}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </SheetClose>
                      <Button
                        variant="destructive"
                        className="w-full justify-center transition-all duration-300"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="default"
                    className="w-full justify-center transition-all duration-300 shadow-sm hover:shadow-md"
                    onClick={() => {
                      handleSignIn()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}

