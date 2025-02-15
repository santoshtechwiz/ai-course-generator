"use client"

import { useState } from "react"
import { Share2, Link, Twitter, Facebook, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"


interface ShareOptionsProps {
  slug: string
}

export function ShareOptions({ slug }: ShareOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const shareUrl = `https://courseai.dev/course/${slug}`

  const handleShare = (platform: string) => {
    let url = ""
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case "copy":
        navigator.clipboard.writeText(shareUrl).then(() => {
          toast({
            title: "Link copied",
            description: "The course link has been copied to your clipboard.",
          })
        })
        return
      default:
        return
    }
    window.open(url, "_blank")
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share this course</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare("copy")}>
            <Link className="mr-2 h-4 w-4" />
            <span>Copy link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("twitter")}>
            <Twitter className="mr-2 h-4 w-4" />
            <span>Share on Twitter</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("facebook")}>
            <Facebook className="mr-2 h-4 w-4" />
            <span>Share on Facebook</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("linkedin")}>
            <Linkedin className="mr-2 h-4 w-4" />
            <span>Share on LinkedIn</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}

