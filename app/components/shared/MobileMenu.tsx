"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Menu, LogOut, LogIn, User, X, Crown } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import { navItems } from "@/constants/navItems"
import Logo from "./Logo"
import { useSubscription } from "@/hooks/useSubscription"

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { subscriptionStatus, isLoading: isLoadingSubscription } = useSubscription()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription || !subscriptionStatus) return null
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE"
    const color = plan === "PRO" ? "yellow" : plan === "BASIC" ? "blue" : plan === "FREE" ? "gray" : "gray"
    return (
      <Badge variant="outline" className={`bg-${color}-500/10 text-${color}-500 border-${color}-500/20`}>
        {plan}
      </Badge>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-full sm:w-[350px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Logo />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      router.push(item.href)
                      setIsOpen(false)
                    }}
                  >
                    {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                    {item.name}
                  </Button>
                </motion.div>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t">
            {session ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={session.user?.image ?? undefined} />
                    <AvatarFallback>{session.user?.name?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{session.user?.email}</p>
                    {getSubscriptionBadge()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/subscription")
                    setIsOpen(false)
                  }}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Subscription
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => signIn()}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenu;