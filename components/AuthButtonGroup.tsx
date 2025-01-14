"use client"

import { AuthButton } from "./authButton"
import GithubLogo from "../public/github.png"
import GoogleLogo from "../public/google.png"
import FacebookLogo from "../public/facebook.png";


interface AuthButtonGroupProps {
  providers: Record<string, any>
  callbackUrl: string
}

export function AuthButtonGroup({ providers, callbackUrl }: AuthButtonGroupProps) {
  return (
    <>
      {Object.values(providers).map((provider: any) => (
        <AuthButton
          key={provider.id}
          provider={provider.id}
          logo={provider.id === 'github' ? GithubLogo : provider.id === 'google' ? GoogleLogo : FacebookLogo}
          text={`Sign in with ${provider.name}`}
          callbackUrl={callbackUrl}
        />
      ))}
    </>
  )
}

