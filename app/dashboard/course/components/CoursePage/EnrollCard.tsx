'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles, Zap } from 'lucide-react'

export default function EnrollCard() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Replace this with your auth logic
  const router = useRouter()

  const handleSubscribeClick = () => {
    if (isLoggedIn) {
      setIsSubscribed(true)
      console.log('User subscribed')
    } else {
      router.push('/dashboard/subscription')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-background p-6 rounded-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Subscribe to Unlock</h2>
        <p className="text-muted-foreground">Generate Your Own Courses and Much More</p>
      </div>
      <div className="space-y-6">
        <p className="text-center text-sm text-muted-foreground">
          Create your course in minutes! Our AI generates summaries, transcripts, and quizzes to enhance your learning. You can also create your own quizzes anytime in seconds.
        </p>
        <ul className="space-y-3">
          {[
            "Generate unlimited personalized courses",
            "AI-generated summaries and transcripts",
            "Create custom quizzes in seconds",
            "Access to all free public courses"
          ].map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          size="lg"
          onClick={handleSubscribeClick}
          disabled={isSubscribed}
        >
          {isSubscribed ? (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Subscribed
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Subscribe Now
            </>
          )}
        </Button>
      </div>
      {isSubscribed && (
        <div className="mt-4">
          <p className="text-center text-green-600 font-semibold">
            Thank you for subscribing! You now have access to all features.
          </p>
        </div>
      )}
    </div>
  )
}

