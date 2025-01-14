import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserX } from 'lucide-react'

export default function UserNotFound() {
  return (
    <div className="container mx-auto flex h-[80vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2">
            <UserX className="h-12 w-12 text-muted-foreground" />
            <span>User Not Found</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We couldn't find your user profile. This might be because you're not logged in
            or your account has been deleted.
          </p>
          <Button asChild>
            <Link href="/auth/signin">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

