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
      transition={prefersReducedMotion ? {} : {
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <Avatar className={cn(
        "h-8 w-8 border-2 transition-all duration-300",
        "border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
        "bg-gradient-to-br from-background to-muted/50"
      )}>
        <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
        <AvatarFallback className={cn(
          "bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold",
          "hover:from-primary/30 hover:to-secondary/30 transition-all duration-300"
        )}>
          {userInitials}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  )
}
