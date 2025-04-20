"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, LogIn } from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function UnauthenticatedContent() {
  return (
    <Card className="w-full max-w-3xl mx-auto border-primary/20 shadow-md">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Lock className="h-6 w-6" />
          Course Content Locked
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-muted-foreground mb-4">
          Please log in or sign up to access the course content and track your progress.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              signIn()
            }}
            variant="default"
            className="w-full mt-4"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
