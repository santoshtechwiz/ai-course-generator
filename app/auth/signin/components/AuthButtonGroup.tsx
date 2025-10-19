"use client"
import { AuthButton } from "./authButton"

const GithubLogo = "/github.png"
const GoogleLogo = "/google.png"
const FacebookLogo = "/facebook.png"

interface AuthButtonGroupProps {
  providers: Record<string, any>
  callbackUrl: string
}

export function AuthButtonGroup({ providers, callbackUrl }: AuthButtonGroupProps) {
  // Filter out any undefined providers
  const validProviders = Object.values(providers || {}).filter(Boolean)

  if (validProviders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No authentication providers available. Please check your configuration.
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-3 w-full max-w-sm mx-auto px-4 sm:px-0">
      {validProviders.map((provider: any) => {
        let logo
        switch (provider.id.toLowerCase()) {
          case "github":
            logo = GithubLogo
            break
          case "google":
            logo = GoogleLogo
            break
          case "facebook":
            logo = FacebookLogo
            break
          case "linkedin":
            logo = "/linkedin.svg"
            break
          default:
            logo = "/api/placeholder"
        }

        return (
          <AuthButton
            key={provider.id}
            provider={provider.id}
            logo={logo}
            text={`Sign in with ${provider.name}`}
            callbackUrl={callbackUrl}
          />
        )
      })}
    </div>
  )
}
