"use client"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)

  // Only render the dropdown after component has mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize theme change handler to prevent unnecessary re-renders
  const handleThemeChange = useCallback(
    (newTheme: string) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-accent-foreground">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-accent-foreground">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl p-1 min-w-[8rem]">
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="flex items-center gap-2 cursor-pointer rounded-md"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === "light" && (
            <motion.div
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
              layoutId="theme-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="flex items-center gap-2 cursor-pointer rounded-md"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && (
            <motion.div
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
              layoutId="theme-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="flex items-center gap-2 cursor-pointer rounded-md"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === "system" && (
            <motion.div
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
              layoutId="theme-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
