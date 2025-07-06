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
    refreshCount?: number // Track refresh attempts
  }
}

// Track active refreshes to prevent duplicates
const activeRefreshes = new Map<string, number>()
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
        token.refreshCount = 0
        return token
      }

      // Force refresh token on session update, but only if explicitly requested
      if (trigger === "update") {
        // Reset refresh count on explicit update
        token.refreshCount = 0
        token.updatedAt = 0 // Force refresh by setting updatedAt to 0
      }

      // On every JWT refresh, get the latest user data
      // Only refresh user data if token is older than 15 minutes to reduce DB load
      const now = Date.now()
      const tokenUpdatedAt = (token.updatedAt as number) || 0
      const refreshInterval = 15 * 60 * 1000 // 15 minutes
      const shouldRefreshToken = !tokenUpdatedAt || now - tokenUpdatedAt > refreshInterval

      // Add refresh throttling to prevent loops
      const refreshCount = token.refreshCount || 0
      const userId = token.id as string

      // Check if this user already has an active refresh
      if (userId && activeRefreshes.has(userId)) {
        const lastRefresh = activeRefreshes.get(userId) || 0
        // If last refresh was less than 5 seconds ago, skip this one
        if (now - lastRefresh < 5000) {
          return token
        }
      }      if (token.id && shouldRefreshToken && refreshCount < 3) {
        try {
          // Mark this user as having an active refresh
          if (userId) {
            activeRefreshes.set(userId, now)
          }

          // Increment refresh count to prevent infinite loops
          token.refreshCount = refreshCount + 1          // Use consistent subscription service to get user data
          const userData = await SubscriptionService.getUserSubscriptionData(token.id)
            if (userData) {
            token.credits = userData.credits
            token.creditsUsed = userData.creditsUsed
            token.isAdmin = false // We'll need to get this from user table separately if needed
            token.userType = userData.userType // This now comes from subscription data
            token.subscriptionPlan = userData.subscription?.planId || null
            token.subscriptionStatus = userData.subscription?.status || null
            token.updatedAt = now
            token.refreshCount = 0 // Reset count after successful refresh
          } else {
            // Fallback to direct user query if subscription service fails
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id },
              include: {
                subscription: true,
              },
            })

            if (dbUser) {
              token.credits = dbUser.credits
              token.creditsUsed = dbUser.creditsUsed
              token.isAdmin = dbUser.isAdmin
              // Use subscription data as source of truth for userType
              token.userType = dbUser.subscription?.status === "ACTIVE" 
                ? dbUser.subscription.planId 
                : "FREE"
              token.subscriptionPlan = dbUser.subscription?.planId || null
              token.subscriptionStatus = dbUser.subscription?.status || null
              token.updatedAt = now
              token.refreshCount = 0
            }
          }

          // Clear the active refresh marker
          if (userId) {
            setTimeout(() => {
              activeRefreshes.delete(userId)
            }, 5000)
          }
        } catch (error) {
          console.error("Error fetching user data for JWT:", error)
          // Don't update the token.updatedAt if there was an error
        }
      }

      return token
    },    async session({ session, token }) {
      if (token && session.user) {        // Only update session if necessary
        if (
          session.user.id !== token.id ||
          session.user.credits !== token.credits ||
          session.user.creditsUsed !== token.creditsUsed ||
          session.user.isAdmin !== token.isAdmin ||
          session.user.userType !== token.userType ||
          session.user.subscriptionPlan !== token.subscriptionPlan ||
          session.user.subscriptionStatus !== token.subscriptionStatus
        ) {
          session.user.id = token.id
          session.user.credits = token.credits || 0
          session.user.creditsUsed = token.creditsUsed || 0
          session.user.isAdmin = token.isAdmin || false
          session.user.userType = token.userType || "FREE"
          session.user.subscriptionPlan = token.subscriptionPlan || null
          session.user.subscriptionStatus = token.subscriptionStatus || null
        }
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
        console.log("Session event triggered", { userId: session?.user?.id })
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
  debug: process.env.NODE_ENV === "development",
}

// Improved session caching with proper invalidation
const SESSION_CACHE = new Map<string, { session: any; timestamp: number }>()
const SESSION_CACHE_MAX_AGE = 30 * 1000 // 30 seconds cache for sessions

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
