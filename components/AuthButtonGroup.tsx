"use client"

import GithubLogo from "../public/github.png"
import GoogleLogo from "../public/google.png"
import FacebookLogo from "../public/facebook.png"
import { AuthButton } from "./authButton"

interface AuthButtonGroupProps {
  providers: Record<string, any>
  callbackUrl: string
}

export function AuthButtonGroup({ providers, callbackUrl }: AuthButtonGroupProps) {
  return (
    <div className="flex flex-col space-y-3 w-full max-w-sm mx-auto px-4 sm:px-0">
      {Object.values(providers).map((provider: any) => (
        <AuthButton
          key={provider.id}
          provider={provider.id}
          logo={provider.id === 'github' ? GithubLogo : provider.id === 'google' ? GoogleLogo : FacebookLogo}
          text={`Sign in with ${provider.name}`}
          callbackUrl={callbackUrl}
        />
      ))}
    </div>
  )
}
