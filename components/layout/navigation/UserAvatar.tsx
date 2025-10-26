"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { User } from "@/types/auth"

interface UserAvatarProps {
  user: User | null
  userInitials: string
  prefersReducedMotion: boolean
}

export function UserAvatar({ user, userInitials, prefersReducedMotion }: UserAvatarProps) {
  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      transition={
        prefersReducedMotion
          ? {}
          : {
              type: "spring",
              stiffness: 400,
              damping: 17,
            }
      }
    >
      <Avatar
        className={cn(
          "h-8 w-8 border-4 transition-all duration-300 shadow-[4px_4px_0px_0px_var(--color-border)]",
          "border-[var(--color-primary)]/50 hover:border-[var(--color-primary)]",
          "bg-[var(--color-bg)]",
        )}
      >
        <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
        <AvatarFallback
          className={cn(
            "bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold border-4 border-[var(--color-primary)]",
            "hover:bg-[var(--color-primary)]/30 transition-all duration-300",
          )}
        >
          {userInitials}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  )
}
