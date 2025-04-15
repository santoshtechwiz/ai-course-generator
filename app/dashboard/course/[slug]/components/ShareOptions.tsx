"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Share2, Copy, Twitter, Facebook, Linkedin, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ShareOptionsProps {
  slug: string
}

export function ShareOptions({ slug }: ShareOptionsProps) {
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  const shareUrl = `${window.location.origin}/course/${slug}`

  const handleCopyLink = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copied!",
        description: "Course link has been copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the URL manually.",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out this course!`,
      "_blank",
    )
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
            "bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-200",
          )}
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Share2 className="h-5 w-5" />
          <span className="flex-1 text-left">Share</span>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink} disabled={copying}>
          {copying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
          <span>Copy link</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter}>
          <Twitter className="mr-2 h-4 w-4" />
          <span>Share to Twitter</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          <span>Share to Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedin}>
          <Linkedin className="mr-2 h-4 w-4" />
          <span>Share to LinkedIn</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

