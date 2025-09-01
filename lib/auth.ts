// Improve session security and token refresh logic
import { type DefaultSession, type DefaultUser, type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { NextResponse } from "next/server"
import LinkedinProvider, { LinkedInProfile } from "next-auth/providers/linkedin"
import type { DefaultJWT } from "next-auth/jwt"
import { prisma } from "./db"
import { sendEmail } from "@/lib/email"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      credits: number
      creditsUsed: number
      accessToken: string
      isAdmin: boolean
      userType: string
      subscriptionPlan: string | null
      subscriptionStatus: string | null
      subscriptionExpirationDate?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    credits: number
    creditsUsed: number
    isAdmin: boolean
    userType: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    credits: number
    creditsUsed: number
    isAdmin: boolean
    userType: string
    subscriptionPlan: string | null
    subscriptionStatus: string | null
    updatedAt?: number
  }
}

// Cache to reduce DB load
const userCache = new Map<string, { data: any; timestamp: number }>()
const USER_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Using JWT for better performance
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add proper cookie configuration for better security
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {      // Initial sign in
      if (user) {
        token.id = user.id
        token.credits = user.credits || 0
        token.creditsUsed = user.creditsUsed || 0
        token.isAdmin = user.isAdmin || false
        token.userType = user.userType || "FREE"
        token.updatedAt = Date.now()
        return token
      }

      // Force refresh token on session update, but only if explicitly requested
      if (trigger === "update") {
        token.updatedAt = 0 // Force refresh by setting updatedAt to 0
      }

      // Only refresh user data when explicitly triggered or token is very old (1 hour)
      const now = Date.now()
      const tokenUpdatedAt = (token.updatedAt as number) || 0
      const refreshInterval = 60 * 60 * 1000 // 1 hour instead of 15 minutes
      const shouldRefreshToken = !tokenUpdatedAt || now - tokenUpdatedAt > refreshInterval

      if (token.id && shouldRefreshToken) {
        try {
          // Simple user query without complex subscription logic
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              credits: true,
              creditsUsed: true,
              isAdmin: true,
              isActive: true,
              userType: true,
              subscription: {
                select: {
                  planId: true,
                  status: true
                }
              }
            },
          })

          if (dbUser) {
            token.credits = dbUser.credits
            token.creditsUsed = dbUser.creditsUsed
            token.isAdmin = dbUser.isAdmin
            token.userType = dbUser.userType
            token.subscriptionPlan = dbUser.subscription?.planId || null
            token.subscriptionStatus = dbUser.subscription?.status || null
            token.updatedAt = now
          }
        } catch (error) {
          console.error("Error fetching user data for JWT:", error)
        }
      }

      return token
    },    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.credits = token.credits || 0
        session.user.creditsUsed = token.creditsUsed || 0
        session.user.isAdmin = token.isAdmin || false
        session.user.userType = token.userType || "FREE"
        session.user.subscriptionPlan = token.subscriptionPlan || null
        session.user.subscriptionStatus = token.subscriptionStatus || null
      }
      
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects more securely
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      try {
        // Update last login time for all sign-ins
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
          },
        })

        // For new users, set default values
        if (isNewUser) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              userType: "FREE",
              credits: 0, // Start with 0 credits - only add when subscribing
              isAdmin: false,
            },
          })

          // Send welcome email to new user
          if (user.email && user.name) {
            await sendEmail(user.email, user.name).catch((err) => console.error("Failed to send welcome email:", err))
          }
        }

        // Record the sign-in provider for analytics
        if (account) {
          try {
            const existingMetric = await prisma.userEngagementMetrics.findUnique({
              where: { userId: user.id },
            })

            if (!existingMetric) {
              await prisma.userEngagementMetrics.create({
                data: {
                  userId: user.id,
                  createdAt: new Date(),
                },
              })
            }
          } catch (error) {
            console.error("Error recording sign-in metrics:", error)
            // Non-critical error, continue sign-in process
          }
        }
      } catch (error) {
        console.error("Error in signIn event:", error)
        // Don't throw here - allow sign-in to continue even if these operations fail
      }
    },
    async session({ session }) {
      if (process.env.NODE_ENV === "development") {
       
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    LinkedinProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      client: { token_endpoint_auth_method: "client_secret_post" },
      issuer: "https://www.linkedin.com",      profile: (profile: LinkedInProfile) => ({
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        credits: 0, 
        creditsUsed: 0,
        isAdmin: false, 
        userType: "FREE", 
      }),
      wellKnown:
        "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
}

// Session caching with proper invalidation
const SESSION_CACHE = new Map<string, { session: any; timestamp: number }>()
const SESSION_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes cache for sessions

// Function to clear caches periodically
const clearCaches = () => {
  const now = Date.now()
  // Clear expired session cache entries
  for (const [key, entry] of SESSION_CACHE.entries()) {
    if (now - entry.timestamp > SESSION_CACHE_MAX_AGE) {
      SESSION_CACHE.delete(key)
    }
  }

  // Clear expired user cache entries
  for (const [key, entry] of userCache.entries()) {
    if (now - entry.timestamp > USER_CACHE_TTL) {
      userCache.delete(key)
    }
  }
}

// Set up periodic cache cleaning
if (typeof window === "undefined") {
  // Only run on server
  setInterval(clearCaches, 5 * 60 * 1000) // Clean every 5 minutes
}

/**
 * Enhanced getAuthSession with improved caching and error handling
 * 
 * @param options Optional configuration
 * @returns The current session or null if not authenticated
 */
export const getAuthSession = async (options?: { 
  skipCache?: boolean;   // Force fresh session fetch
  cacheKey?: string;     // Custom cache key (e.g., for user-specific caching)
}) => {
  const cacheKey = options?.cacheKey || "global"
  const now = Date.now()

  // Skip cache if requested or in development with debugSession=true query param
  if (!options?.skipCache) {
    // Check cache
    const cached = SESSION_CACHE.get(cacheKey)
    if (cached && now - cached.timestamp < SESSION_CACHE_MAX_AGE) {
      return cached.session
    }
  }

  // Fetch a new session if not cached or expired
  try {
    const session = await getServerSession(authOptions)

    // Cache the result (even if null to prevent hammering the session API)
    SESSION_CACHE.set(cacheKey, {
      session,
      timestamp: now,
    })

    return session
  } catch (error) {
    console.error("Error fetching auth session:", error)
    return null
  }
}

// Helper to check if user is authenticated
export async function isAuthenticated() {
  try {
    const session = await getAuthSession()
    return !!session?.user
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}

// Helper to check if user is admin
export async function isAdmin() {
  try {
    const session = await getAuthSession()
    return session?.user?.isAdmin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Standard unauthorized response
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Helper to clear expired sessions
export async function clearExpiredSessions() {
  try {
    const now = new Date()
    await prisma.session.deleteMany({
      where: {
        expires: { lt: now },
      },
    })
  } catch (error) {
    console.error("Error clearing expired sessions:", error)
  }
}

// Helper to update user data
export async function updateUserData(userId: string, data: any) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    })

    // Invalidate caches to ensure fresh data
    invalidateSessionCache()
    userCache.delete(userId)
  } catch (error) {
    console.error("Error updating user data:", error)
    throw error
  }
}

// Invalidate session cache
export function invalidateSessionCache() {
  SESSION_CACHE.clear()
  // Also clear userCache if you want to be thorough
  userCache.clear()
}
