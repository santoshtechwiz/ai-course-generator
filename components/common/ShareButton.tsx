"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Share2, Facebook, Twitter, Check, LinkIcon, Linkedin } from "lucide-react"
import { useState } from "react"


import { buildQuizUrl } from "@/lib/utils"
import { useToast } from "@/hooks"
import type { QuizType } from "@/app/types/quiz-types"
import { Button } from "../ui/button"

export function ShareButton({ slug, title, type }: { slug: string; title: string; type: QuizType }) {
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const { toast } = useToast()

  const quizUrl = `${process.env.NEXT_PUBLIC_URL}${buildQuizUrl(slug, type)}`

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(quizUrl)
      .then(() => {
        setIsLinkCopied(true)
        toast({
          title: "Link copied!",
          description: "Quiz link has been copied to your clipboard.",
        })
        setTimeout(() => setIsLinkCopied(false), 2000)
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      })
  }

  const handleShareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  const handleShareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(quizUrl)}&text=${encodeURIComponent(`Check out this quiz: ${title}`)}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  const handleShareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShareOnFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareOnTwitter}>
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareOnLinkedIn}>
          <Linkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {isLinkCopied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
