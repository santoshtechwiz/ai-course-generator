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
// Enhanced animation variants for shadcn UI components
// These variants are designed to be reusable across the application

// Main container animations
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
      when: "beforeChildren",
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
      when: "afterChildren",
    }
  }
};

// Header animations with improved staggering
export const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  }
};

// Item animations with improved spring physics
export const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 30,
      duration: 0.3
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 30,
      duration: 0.2
    }
  },
  hover: {
    scale: 1.05,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }
  },
  tap: {
    scale: 0.95,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }
  }
};

// Dropdown menu animations
export const dropdownVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: -5
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

// Mobile menu animations
export const mobileMenuVariants = {
  hidden: { 
    opacity: 0, 
    x: "-100%" 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.07,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: "-100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Page transition animations
export const pageTransitionVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0], // Custom cubic bezier for smooth entry
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0],
    }
  }
};

// Badge animations
export const badgeVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20
    }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.6,
      ease: "easeInOut",
      times: [0, 0.5, 1],
      repeat: 0
    }
  }
};

// Notification animation
export const notificationVariants = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// Icon animations
export const iconVariants = {
  hidden: { 
    opacity: 0, 
    rotate: -10, 
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  },
  hover: {
    scale: 1.15,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  },
  tap: {
    scale: 0.9,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  }
};

// Underline animations for navigation
export const underlineVariants = {
  hidden: { 
    opacity: 0, 
    width: 0 
  },
  visible: {
    opacity: 1,
    width: "100%",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    width: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Scroll-triggered animations
export const scrollAnimationVariants = {
  hidden: { 
    opacity: 0, 
    y: 30 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.6
    }
  }
};



// Enhanced NavItems component with improved animations and Link instead of Button
const NavItems = () => {
  const pathname = usePathname()

  return (
    <motion.nav
      className="mx-6 hidden items-center space-x-4 md:flex"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {navItems.map((item, index) => (
        <motion.div
          key={item.name}
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
          custom={index}
        >
          <Link
            href={item.href}
            className={`relative flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
              } overflow-hidden group`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center"
            >
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                className="inline-flex"
              >
                <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </motion.div>
              <span className="ml-2">{item.name}</span>
              {item.subItems.length > 0 && (
                <motion.div
                  animate={{ rotate: pathname === item.href ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3 ml-1.5 transition-transform duration-200" />
                </motion.div>
              )}
            </motion.div>

            {pathname === item.href && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                variants={underlineVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              />
            )}
          </Link>
        </motion.div>
      ))}
    </motion.nav>
  )
}

export default function MainNavbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const { subscriptionStatus, isLoading: isLoadingSubscription, refreshSubscription } = useSubscriptionStore()
  const pathname = usePathname()
  const [creditScore, setCreditScore] = useState(0)

  // Refresh subscription data on mount and periodically
  useEffect(() => {
    refreshSubscription()

    // Set up a refresh interval (every 60 seconds)
    const intervalId = setInterval(() => {
      refreshSubscription()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [refreshSubscription])

  // Update credit score whenever subscription status changes
  useEffect(() => {
    if (subscriptionStatus && subscriptionStatus.credits !== undefined) {
      setCreditScore(subscriptionStatus.credits)
    }
  }, [subscriptionStatus])

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
        variants={badgeVariants}
        initial="hidden"
        animate="visible"
        whileHover="pulse"
      >
        <Badge variant="outline" className={`ml-2 font-medium ${getBadgeStyles()} transition-all duration-300`}>
          {plan}
        </Badge>
      </motion.div>
    )
  }

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${scrolled ? "shadow-md border-transparent" : ""
        }`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between px-4 sm:px-6">
        <motion.div className="flex items-center flex-shrink-0" variants={itemVariants}>
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={itemVariants}
          >
            <Link href="/" className="cursor-pointer">
              <Logo />
            </Link>
          </motion.div>
          <NavItems />
        </motion.div>

        <motion.div
          className="flex items-center gap-2 md:gap-4 flex-shrink-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={iconVariants}
            whileHover="hover"
            whileTap="tap"
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
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <NotificationsMenu initialCount={creditScore} refreshCredits={refreshSubscription} />
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ThemeToggle />
          </motion.div>

          {status === "authenticated" ? (
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <UserMenu>
                <DropdownMenuContent
                  className="w-56 rounded-xl p-2 shadow-lg border border-border/50 backdrop-blur-sm bg-background/95"
                  align="end"
                  forceMount
                  sideOffset={8}
                  asChild
                >
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col space-y-1.5 p-2"
                    >
                      {session?.user?.name && <p className="font-medium text-foreground">{session.user.name}</p>}
                      {session?.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                      )}
                      {getSubscriptionBadge()}
                    </motion.div>

                    <DropdownMenuSeparator className="my-1" />

                    <motion.div variants={itemVariants}>
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

                    <motion.div variants={itemVariants}>
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
                      <motion.div variants={itemVariants}>
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

                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center cursor-pointer rounded-md text-destructive focus:text-destructive py-1.5 mt-1 transition-colors duration-200 focus:bg-destructive/10"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </motion.div>
                  </motion.div>
                </DropdownMenuContent>
              </UserMenu>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="hidden md:block"
            >
              <Link
                href="/auth/signin"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignIn();
                }}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span className="font-medium">Sign In</span>
              </Link>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
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
          asChild
        >
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AnimatePresence>
              <motion.div
                className="flex flex-col h-full"
                variants={containerVariants}
              >
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center justify-between">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                      <Logo size="small" />
                    </Link>
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
                        variants={itemVariants}
                        custom={index}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            className={`flex items-center justify-start rounded-md w-full px-3 py-2 transition-all duration-200 ${pathname === item.href
                                ? "bg-accent text-accent-foreground font-medium"
                                : "hover:bg-accent/50"
                              }`}
                          >
                            <item.icon className={`mr-2 h-4 w-4 ${pathname === item.href ? "text-primary" : ""}`} />
                            {item.name}
                            {item.subItems.length > 0 && (
                              <motion.div
                                animate={{ rotate: pathname === item.href ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-auto"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </motion.div>
                            )}
                          </Link>
                        </SheetClose>
                      </motion.div>
                    ))}
                  </nav>
                </div>

                <motion.div
                  className="p-4 border-t mt-auto"
                  variants={itemVariants}
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
                          <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
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
                    <Link
                      href="/auth/signin"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSignIn();
                        setIsMobileMenuOpen(false);
                      }}
                      className="inline-flex w-full items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}
