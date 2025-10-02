"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetHeader } from "@/components/ui/sheet"
import { navItems } from "@/constants/navItems"
import { useRouter, usePathname } from "next/navigation"

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px]" aria-label="Toggle menu">
            <Menu className="h-6 w-6" />
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-r backdrop-blur-lg">
        <SheetHeader className="flex items-center justify-between p-3 sm:p-4 border-b">
          <SheetTitle className="text-base sm:text-lg">Menu</SheetTitle>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close menu" className="min-h-[44px] min-w-[44px]">
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </SheetHeader>
        <nav className="flex flex-col space-y-2 sm:space-y-3 mt-4 sm:mt-6 px-3 sm:px-4">
          <AnimatePresence>
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={`w-full justify-start rounded-lg transition-all duration-300 min-h-[48px] text-base ${
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/80 hover:translate-x-1"
                  }`}
                  onClick={() => handleNavigation(item.href)}
                >
                  <motion.div
                    className="flex items-center w-full"
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </motion.div>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenu
