import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation' // Use Next.js router for redirection
import { Button } from "@/components/ui/button"
import { signIn } from 'next-auth/react'

export default function LockOverlay() {


  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Content Locked</h3>
        <p className="text-sm text-muted-foreground mb-4">Sign in to access this content</p>
        <Button onClick={() => signIn()} >Sign In</Button>
      </div>
    </div>
  )
}
