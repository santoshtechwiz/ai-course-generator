import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Share2, Facebook, Twitter, Check, LinkIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const [isLinkCopied, setIsLinkCopied] = useState(false)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dahsboard/quizzes/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setIsLinkCopied(true)
      setTimeout(() => setIsLinkCopied(false), 2000) // Reset after 2 seconds
    })
  }

  const handleShareOnFacebook = () => {
    const url = `${window.location.origin}/dahsboard/quizzes/${slug}`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
  }

  const handleShareOnTwitter = () => {
    const url = `${window.location.origin}/dashboard/quizzes/${slug}`
    const text = `Check out this quiz: ${title}`
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShareOnFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareOnTwitter}>
          <Twitter className="mr-2 h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {isLinkCopied ? <Check className="mr-2 h-4 w-4" /> : <LinkIcon className="mr-2 h-4 w-4" />}
          {isLinkCopied ? "Link Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}