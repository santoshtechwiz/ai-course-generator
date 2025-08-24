"use client"

import React from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCourseActions } from "@/hooks/useCourseActions"
import { useAuth } from "@/modules/auth"

interface ActionButtonsProps {
  slug: string
  title: string
  isOwner: boolean
  className?: string
  variant?: "default" | "compact"
}

export default function ActionButtons({ slug, title, isOwner, className = "", variant = "compact" }: ActionButtonsProps) {
  const { isAuthenticated } = useAuth()
  const { status, loading, handleAction } = useCourseActions({ slug })

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) return
    handleAction("favorite")
  }

  const handlePrivacyToggle = () => {
    if (!isOwner) return
    handleAction("privacy")
  }

  const handleDelete = () => {
    if (!isOwner) return
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      handleAction("delete")
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-1"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      {/* Favorite Button (for authenticated users) */}
      {isAuthenticated && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFavoriteToggle}
          disabled={loading === "favorite"}
          className={cn(
            "flex items-center gap-1",
            status.isFavorite && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
          )}
        >
          {loading === "favorite" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />
          )}
          <span className="hidden sm:inline">
            {status.isFavorite ? "Favorited" : "Favorite"}
          </span>
        </Button>
      )}

      {/* Privacy Status Badge */}
      {isOwner && (
        <Badge variant={status.isPublic ? "default" : "secondary"} className="hidden md:inline-flex">
          {status.isPublic ? (
            <>
              <Globe className="h-3 w-3 mr-1" />
              Public
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 mr-1" />
              Private
            </>
          )}
        </Badge>
      )}

      {/* Owner Actions */}
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePrivacyToggle} disabled={loading === "privacy"}>
              {loading === "privacy" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : status.isPublic ? (
                <Lock className="h-4 w-4 mr-2" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Make {status.isPublic ? "Private" : "Public"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={loading === "delete"}
              className="text-red-600 focus:text-red-600"
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