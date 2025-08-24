"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, User as UserIcon } from 'lucide-react'

interface AuthPromptProps {
  onUpgrade: () => void
  onSignIn: () => void
  onBack: () => void
}

const AuthPrompt: React.FC<AuthPromptProps> = ({
  onUpgrade,
  onSignIn,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Unlock this lesson</h3>
          <p className="text-muted-foreground mb-6">
            The first two chapters (including summary and quiz) are free. Upgrade your plan to access all remaining lessons.
          </p>
          <div className="space-y-3">
            <Button onClick={onUpgrade} className="w-full" size="lg">
              Upgrade Now
            </Button>
            <Button variant="outline" onClick={onSignIn} className="w-full">
              <UserIcon className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full">
              Back to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default React.memo(AuthPrompt)