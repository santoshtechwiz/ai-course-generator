"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetHeader,
} from "@/components/ui/sheet"
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
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="flex items-center justify-between p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-8 px-4">
          <AnimatePresence>
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    pathname === item.href ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => handleNavigation(item.href)}
                >
                  {item.name}
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
