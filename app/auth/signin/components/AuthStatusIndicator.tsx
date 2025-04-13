"use client"

import { useSession } from "next-auth/react"
import { Loader2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signIn, signOut } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"


export function AuthStatusIndicator() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: "/" })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking authentication...</span>
      </div>
    )
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-green-500" />
        <span>Signed in as {session.user.name || session.user.email}</span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <UserX className="h-4 w-4 text-red-500" />
      <span>Not signed in</span>
      <Button variant="outline" size="sm" onClick={() => signIn()}>
        Sign In
      </Button>
    </div>
  )
}
