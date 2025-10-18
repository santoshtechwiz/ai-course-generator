import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, LogIn, LogOut, User } from "lucide-react"

export function AuthDebugPanel() {
  const { data: session, status } = useSession()

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          Debug panel to check authentication status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">{status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">User Type</p>
            <p className="text-lg font-semibold">{session?.user?.userType || 'N/A'}</p>
          </div>
        </div>

        {session ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-success/10 dark:bg-success/5">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-success" />
                <span className="font-medium text-success">Authenticated</span>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {session.user?.name}</p>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Admin:</strong> {session.user?.isAdmin ? 'Yes' : 'No'}</p>
                <p><strong>Credits:</strong> {session.user?.credits}</p>
                <p><strong>Expires:</strong> {new Date(session.expires).toLocaleString()}</p>
              </div>
            </div>
            
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-destructive/10 dark:bg-destructive/5">
              <div className="flex items-center gap-2 mb-2">
                <LogIn className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Not Authenticated</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Please sign in to access admin features.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button onClick={() => signIn('google')} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with Google
              </Button>
              <Button onClick={() => signIn('github')} variant="outline" className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with GitHub
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}