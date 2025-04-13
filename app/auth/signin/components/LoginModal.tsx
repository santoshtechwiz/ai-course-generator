"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProviders, signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"


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
  const [providers, setProviders] = useState<any>(null)
  const [isLoadingProviders, setIsLoadingProviders] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
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
      const fetchProviders = async () => {
        setIsLoadingProviders(true)
        try {
          const res = await getProviders()
          setProviders(res)
        } catch (error) {
          console.error("Failed to fetch providers:", error)
          toast({
            title: "Error",
            description: "Failed to load authentication providers. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoadingProviders(false)
        }
      }

      fetchProviders()
    }
  }, [isOpen, toast])

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

    setIsAuthenticating(true)
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
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Custom handler for provider sign in to prevent modal dismissal
  const handleProviderSignIn = async (provider: string) => {
    setIsAuthenticating(true)
    try {
      // Using signIn directly here instead of through AuthContext
      await signIn(provider.toLowerCase(), { callbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      setIsAuthenticating(false)
      toast({
        title: "Authentication failed",
        description: `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive",
      })
    }
    // Note: We don't set isAuthenticating to false here because we're redirecting
  }

  // Custom AuthButtonGroup for the modal that uses our local handler
  const ModalAuthButtonGroup = () => {
    if (!providers) return null

    return (
      <div className="flex flex-col space-y-3 w-full max-w-sm mx-auto px-4 sm:px-0">
        {Object.values(providers).map((provider: any) => (
          <button
            key={provider.id}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleProviderSignIn(provider.id)
            }}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center h-12 px-4 sm:px-6 text-base sm:text-lg font-medium transition-all duration-300 bg-white border-2 border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span className="mr-2">
                  {provider.name === "Google" ? "G" : provider.name === "GitHub" ? "GH" : "FB"}
                </span>
                <span>Sign in with {provider.name}</span>
              </>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isAuthenticating) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[425px] animate-in fade-in-50 zoom-in-90 duration-300"
        onPointerDownOutside={(e) => {
          if (isAuthenticating) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isAuthenticating) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Sign in to continue</DialogTitle>
          <DialogDescription>Please sign in to your account to access subscription features.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 py-4">
          {/* Auth Providers */}
          {isLoadingProviders ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ModalAuthButtonGroup />
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
