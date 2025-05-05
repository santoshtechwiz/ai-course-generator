import NextAuth from "next-auth"
import { authOptions as baseAuthOptions } from "@/lib/authOptions"
import { getGitHubCredentials } from "@/config/github-config"

// Create a handler that extends the base auth options with dynamic GitHub credentials
import { NextApiRequest, NextApiResponse } from "next"

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Get the hostname from the request
  const hostname = req.headers.host || ""

  // Get the appropriate GitHub credentials
  const githubCredentials = getGitHubCredentials(hostname)

  // Create a new authOptions object with the correct GitHub provider
  const authOptions = {
    ...baseAuthOptions,
    providers: baseAuthOptions.providers.map((provider) => {
      // Replace GitHub provider with one using the correct credentials
      if (provider.id === "github") {
        return {
          ...provider,
          clientId: githubCredentials.clientId,
          clientSecret: githubCredentials.clientSecret,
        }
      }
      return provider
    }),
  }

  return await NextAuth(req, res, authOptions);
}
