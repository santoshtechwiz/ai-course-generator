"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Heart,
  Share2,
  MoreVertical,
  Globe,
  Lock,
  Trash2,
  Loader2,
  Star,
  Users,
  Eye,
  EyeOff,
  Download,
  Copy,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { useCourseActions } from "@/hooks/useCourseActions"
import { useAuth } from "@/modules/auth"
import { toast } from "@/components/ui/use-toast"
import { ShareButton } from "@/components/features/share"
import { useAppSelector } from "@/store/hooks"

interface ActionButtonsProps {
  slug: string
  title: string
  isOwner: boolean
  courseId?: number | string
  className?: string
  variant?: "default" | "compact"
}

export default function ActionButtons({ slug, title, isOwner, courseId, className = "", variant = "compact" }: ActionButtonsProps) {
  const { isAuthenticated } = useAuth()
  const { status, loading, handleAction } = useCourseActions({ slug })

  const handleShare = async () => {
    try {
      const url = window.location.href
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this course: ${title}`,
          url: url,
        })
        toast({
          title: "Shared successfully",
          description: "Course link shared via device sharing",
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast({
          title: "Link copied",
          description: "Course link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Share failed",
        description: "Could not share the course link",
        variant: "destructive",
      })
    }
  }

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to favorite courses",
        variant: "destructive",
      })
      return
    }
    handleAction("favorite")
    toast({
      title: status.isFavorite ? "Removed from favorites" : "Added to favorites",
      description: status.isFavorite ? "Course removed from your favorites" : "Course added to your favorites",
    })
  }

  const handlePrivacyToggle = () => {
    if (!isOwner) return
    handleAction("privacy")
    toast({
      title: status.isPublic ? "Made private" : "Made public",
      description: status.isPublic ? "Course is now private" : "Course is now public",
    })
  }

  const handleDelete = () => {
    if (!isOwner) return
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      handleAction("delete")
      toast({
        title: "Course deleted",
        description: "The course has been permanently deleted",
      })
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Share with Friends Button (using Share Module) */}
      {courseId && (
        <ShareButton
          resourceType="course"
          resourceId={courseId}
          resourceTitle={title}
          resourceSlug={slug}
          variant="noShadow"
          size="sm"
          showLabel={variant === "default"}
          className={cn(
            "transition-all duration-200 hover:shadow-md",
            variant === "compact" && "px-3"
          )}
        />
      )}

      {/* Enhanced Share Button (Device Share) */}
      <Button
        variant="noShadow"
        size="sm"
        onClick={handleShare}
        className={cn(
          "flex items-center gap-2 transition-all duration-200 hover:shadow-md",
          variant === "compact" && "px-3"
        )}
        title="Share with device options"
      >
        <Share2 className="h-4 w-4" />
        {variant === "default" && <span>Quick Share</span>}
      </Button>

      {/* Enhanced Favorite Button */}
      {isAuthenticated && (
        <Button
          variant="neutral"
          size="sm"
          onClick={handleFavoriteToggle}
          disabled={loading === "favorite"}
          className={cn(
            "flex items-center gap-2 transition-all duration-200 hover:shadow-md",
            status.isFavorite && "bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20 hover:bg-[hsl(var(--accent))]/20 dark:bg-[hsl(var(--accent))]/10 dark:text-[hsl(var(--accent))] dark:border-[hsl(var(--accent))]/30 dark:hover:bg-[hsl(var(--accent))]/20",
            variant === "compact" && "px-3"
          )}
        >
          {loading === "favorite" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />
          )}
          {variant === "default" && (
            <span>{status.isFavorite ? "Favorited" : "Favorite"}</span>
          )}
        </Button>
      )}

      {/* Enhanced Privacy Status Badge */}
      {isOwner && (
        <Badge
          variant={status.isPublic ? "default" : "neutral"}
          className={cn(
            "hidden md:inline-flex items-center gap-1 transition-all duration-200",
            neo.badge,
            status.isPublic
              ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20 dark:bg-[hsl(var(--success))]/10 dark:text-[hsl(var(--success))]"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          )}
        >
          {status.isPublic ? (
            <>
              <Eye className="h-3 w-3" />
              Public
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              Private
            </>
          )}
        </Badge>
      )}

      {/* Enhanced Owner Actions Dropdown */}
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-200 hover:shadow-md"
            >
              <MoreVertical className="h-4 w-4" />
              {variant === "default" && <span className="ml-2">Actions</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handlePrivacyToggle}
              disabled={loading === "privacy"}
              className="cursor-pointer"
            >
              {loading === "privacy" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : status.isPublic ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Make {status.isPublic ? "Private" : "Public"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={loading === "delete"}
              className="text-[hsl(var(--destructive))] focus:text-[hsl(var(--destructive))] cursor-pointer"
            >
              {loading === "delete" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}