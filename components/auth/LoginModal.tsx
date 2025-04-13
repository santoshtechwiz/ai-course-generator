"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, getProviders } from "next-auth/react"
import { X, LogIn, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AuthButtonGroup } from "@/components/AuthButtonGroup"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  callbackUrl?: string
  subscriptionData?: {
    planName: string
    duration: number
    promoCode?: string
    promoDiscount?: number
    referralCode?: string
  }
}

export function LoginModal({
  isOpen,
  onClose,
  callbackUrl = "/dashboard/subscription",
  subscriptionData,
}: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Store subscription data in localStorage when modal opens
  useEffect(() => {
    if (isOpen && subscriptionData) {
      localStorage.setItem("pendingSubscription", JSON.stringify(subscriptionData))
    }
  }, [isOpen, subscriptionData])

  // Fetch auth providers when modal is opened
  useEffect(() => {
    if (isOpen) {
      getProviders().then((res) => setProviders(res))
    }
  }, [isOpen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        toast({
          title: "Authentication failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Success!",
        description: "You've been successfully logged in.",
      })

      setTimeout(() => {
        router.push(callbackUrl)
        onClose()
      }, 1000)
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] animate-in fade-in-50 zoom-in-90 duration-300">
        <DialogHeader>
          <DialogTitle className="text-xl">Sign in to continue</DialogTitle>
          <DialogDescription>
            Please sign in to your account to access subscription features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 py-4">
       

          {/* Auth Providers */}
          {providers && (
            <AuthButtonGroup providers={providers} callbackUrl={callbackUrl} />
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
