"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import Placeholder from "./placeholder"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  >
    {children}
  </AvatarPrimitive.Fallback>
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Enhanced Avatar with CourseAI placeholder fallback
interface EnhancedAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  variant?: "default" | "user" | "course"
}

const EnhancedAvatar: React.FC<EnhancedAvatarProps> = ({
  src,
  alt = "",
  fallback = "CA",
  size = "md",
  className,
  variant = "user"
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  const [imageError, setImageError] = React.useState(false)

  if (!src || imageError) {
    return (
      <Placeholder
        text={fallback}
        width={size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64}
        height={size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64}
        variant={variant}
        className={cn("rounded-full", sizeClasses[size], className)}
      />
    )
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={src}
        alt={alt}
        onError={() => setImageError(true)}
      />
      <AvatarFallback>
        <Placeholder
          text={fallback}
          variant={variant}
          className="w-full h-full rounded-full"
        />
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, EnhancedAvatar }
export default EnhancedAvatar
