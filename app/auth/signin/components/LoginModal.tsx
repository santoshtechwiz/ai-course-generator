"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  
  // Prevent duplicate provider fetches
  const isFetchingProviders = useRef(false)

  // Store subscription data in localStorage when modal opens
  useEffect(() => {
    if (isOpen && subscriptionData) {
      try {
        localStorage.setItem("pendingSubscription", JSON.stringify(subscriptionData))
      } catch (error) {
        console.error("Failed to store subscription data:", error)
      }
    }
  }, [isOpen, subscriptionData])

  // Fetch auth providers when modal is opened
  useEffect(() => {
    if (isOpen && !providers && !isFetchingProviders.current) {
      const fetchProviders = async () => {
        isFetchingProviders.current = true
        setIsLoadingProviders(true)
        try {
          const res = await getProviders()
          // Validate the response
          if (res && typeof res === 'object') {
            setProviders(res)
          } else {
            console.error("Invalid providers response:", res)
            toast({
              title: "Error",
              description: "Failed to load authentication options. Please try again.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Failed to fetch providers:", error)
          toast({
            title: "Error",
            description: "Failed to load authentication providers. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoadingProviders(false)
          isFetchingProviders.current = false
        }
      }

      fetchProviders()
    }
    
    // Cleanup function to reset state when modal closes
    return () => {
      if (!isOpen) {
        // Don't clear providers to avoid refetching if modal reopens
        setEmail("")
        setPassword("")
        // Only reset authentication state if not in progress
        if (!isAuthenticating) {
          setIsAuthenticating(false)
        }
      }
    }
  }, [isOpen, providers, toast])

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

  // Custom handler for provider sign in with debounce to prevent multiple clicks
  const handleProviderSignIn = async (provider: string) => {
    if (isAuthenticating) return
    
    setIsAuthenticating(true)
    try {
      // Validate callbackUrl is a valid URL path
      const safeCallbackUrl = callbackUrl && typeof callbackUrl === 'string' 
        ? callbackUrl 
        : '/dashboard'
        
      // Using signIn directly here instead of through AuthContext
      await signIn(provider.toLowerCase(), { callbackUrl: safeCallbackUrl })
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
      <div className="flex flex-col space-y-4 w-full">
        {Object.values(providers).map((provider: any) => {
          // Customize button appearance based on provider
          const getProviderStyles = (id: string) => {
            switch (id.toLowerCase()) {
              case "google":
                return {
                  icon: "G",
                  bgColor: "bg-white hover:bg-gray-50",
                  textColor: "text-gray-800",
                  borderColor: "border-gray-300 hover:border-gray-400",
                }
              case "github":
                return {
                  icon: "GH",
                  bgColor: "bg-gray-900 hover:bg-gray-800",
                  textColor: "text-white",
                  borderColor: "border-gray-800 hover:border-gray-700",
                }
              default:
                return {
                  icon: id.charAt(0).toUpperCase(),
                  bgColor: "bg-white hover:bg-gray-50",
                  textColor: "text-gray-800",
                  borderColor: "border-gray-300 hover:border-gray-400",
                }
            }
          }

          const style = getProviderStyles(provider.id)

          return (
            <button
              key={provider.id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleProviderSignIn(provider.id)
              }}
              disabled={isAuthenticating}
              className={`w-full flex items-center justify-center h-12 px-6 text-base font-medium transition-all duration-300 ${style.bgColor} ${style.textColor} border-2 ${style.borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]`}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <div className="mr-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold">{style.icon}</span>
                  </div>
                  <span>Continue with {provider.name}</span>
                </>
              )}
            </button>
          )
        })}
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
        className="sm:max-w-[425px] animate-in fade-in-50 zoom-in-90 duration-300 p-0 overflow-hidden shadow-lg border-border/60"
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
        <div className="bg-primary/5 p-6 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sign in to continue</DialogTitle>
            <DialogDescription className="text-base mt-1">
              Please sign in to your account to access subscription features.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 p-6">
          {/* Auth Providers */}
          {isLoadingProviders ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading authentication options...</p>
            </div>
          ) : (
            <ModalAuthButtonGroup />
          )}

          {/* Additional information */}
          <div className="text-center text-sm text-muted-foreground pt-5 mt-2 border-t border-border/40">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
