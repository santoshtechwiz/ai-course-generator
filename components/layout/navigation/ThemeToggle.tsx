"use client"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = useCallback(
    (newTheme: string) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "border-3 border-[var(--color-border)]",
          "hover:shadow-[3px_3px_0px_0px_var(--color-border)]",
          "transition-all duration-150 rounded-none",
        )}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "border-3 border-[var(--color-border)]",
            "hover:shadow-[3px_3px_0px_0px_var(--color-border)]",
            "transition-all duration-150 rounded-none",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
          )}
          suppressHydrationWarning
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "rounded-none p-2 min-w-[8rem]",
          "bg-[var(--color-card)] border-3 border-[var(--color-border)]",
          "shadow-[var(--shadow-neo)]",
        )}
      >
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className={cn(
            "flex items-center gap-2 cursor-pointer rounded-none p-2",
            "border-2 border-transparent",
            "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]",
            "transition-all duration-150",
          )}
        >
          <Sun className="h-4 w-4" />
          <span className="font-medium">Light</span>
          {theme === "light" && (
            <motion.div
              className="ml-auto h-2 w-2 rounded-full bg-[var(--color-primary)]"
              layoutId="theme-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className={cn(
            "flex items-center gap-2 cursor-pointer rounded-none p-2",
            "border-2 border-transparent",
            "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]",
            "transition-all duration-150",
          )}
        >
          <Moon className="h-4 w-4" />
          <span className="font-medium">Dark</span>
          {theme === "dark" && (
            <motion.div
              className="ml-auto h-2 w-2 rounded-full bg-[var(--color-primary)]"
              layoutId="theme-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className={cn(
            "flex items-center gap-2 cursor-pointer rounded-none p-2",
            "border-2 border-transparent",
            "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]",
            "transition-all duration-150",
          )}
        >
          <Monitor className="h-4 w-4" />
          <span className="font-medium">System</span>
          {theme === "system" && (
            <motion.div
              className="ml-auto h-2 w-2 rounded-full bg-[var(--color-primary)]"
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
