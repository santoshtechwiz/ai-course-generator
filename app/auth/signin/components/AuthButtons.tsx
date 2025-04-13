"use client"

import { motion } from "framer-motion"
import { AuthButton } from "./authButton"
import githubLogo from "../public/github.png"
import googleLogo from "../public/google.png"
import facebookLogo from "../public/facebook.png"
import { Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"


const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
}

interface AuthButtonProps {
  callbackUrl: string
}

function AuthButtonSkeleton() {
  return (
    <div className="w-full h-12 flex items-center justify-center bg-gray-100 rounded-lg">
      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
    </div>
  )
}

export function GoogleSignInButton({ callbackUrl }: AuthButtonProps) {
  const { isLoading } = useAuth()

  if (isLoading) return <AuthButtonSkeleton />

  return (
    <motion.div variants={buttonVariants} custom={0} initial="hidden" animate="visible">
      <AuthButton provider="Google" logo={googleLogo} text="Sign in with Google" callbackUrl={callbackUrl} />
    </motion.div>
  )
}

export function GithubSignInButton({ callbackUrl }: AuthButtonProps) {
  const { isLoading } = useAuth()

  if (isLoading) return <AuthButtonSkeleton />

  return (
    <motion.div variants={buttonVariants} custom={1} initial="hidden" animate="visible">
      <AuthButton provider="Github" logo={githubLogo} text="Sign in with Github" callbackUrl={callbackUrl} />
    </motion.div>
  )
}

export function FacebookSignInButton({ callbackUrl }: AuthButtonProps) {
  const { isLoading } = useAuth()

  if (isLoading) return <AuthButtonSkeleton />

  return (
    <motion.div variants={buttonVariants} custom={2} initial="hidden" animate="visible">
      <AuthButton provider="Facebook" logo={facebookLogo} text="Sign in with Facebook" callbackUrl={callbackUrl} />
    </motion.div>
  )
}

export function CredentialsSignInButton({ callbackUrl }: AuthButtonProps) {
  const { isLoading } = useAuth()

  if (isLoading) return <AuthButtonSkeleton />

  return (
    <motion.div variants={buttonVariants} custom={3} initial="hidden" animate="visible">
      <AuthButton provider="credentials" logo="/email-icon.png" text="Continue with Email" callbackUrl={callbackUrl} />
    </motion.div>
  )
}
