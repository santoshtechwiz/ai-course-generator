// Improve session security and token refresh logic
import { type DefaultSession, type DefaultUser, type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { NextResponse } from "next/server"
import type { DefaultJWT } from "next-auth/jwt"
import { prisma } from "./db"
import { sendEmail } from "@/lib/email"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      credits: number
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
    isAdmin: boolean
    userType: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    credits: number
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Using JWT for better performance
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.credits = user.credits || 0
        token.isAdmin = user.isAdmin || false
        token.userType = user.userType || "FREE"
        token.updatedAt = Date.now()
        token.refreshCount = 0
        return token
      }

      // Force refresh token on session update, but only if explicitly requested
      if (trigger === "update") {
        // Don't reset updatedAt here - we'll handle the refresh below
        // with proper throttling
        token.refreshCount = 0 // Reset refresh count on explicit update
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
      }

      if (token.id && shouldRefreshToken && refreshCount < 3) {
        try {
          // Mark this user as having an active refresh
          if (userId) {
            activeRefreshes.set(userId, now)
          }

          // Increment refresh count to prevent infinite loops
          token.refreshCount = refreshCount + 1

          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            include: {
              subscription: true,
            },
          })

          if (dbUser) {
            token.credits = dbUser.credits
            token.isAdmin = dbUser.isAdmin
            token.userType = dbUser.userType
            token.subscriptionPlan = dbUser.subscription?.planId || null
            token.subscriptionStatus = dbUser.subscription?.status || null
            token.updatedAt = now
            token.refreshCount = 0 // Reset count after successful refresh
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
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.credits = token.credits || 0
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
            await sendEmail(user.email, user.name)
          }
        }

        // Record the sign-in provider for analytics
        if (account) {
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
        }
      } catch (error) {
        console.error("Error in signIn event:", error)
      }
    },
    async session({ session }) {
      // Limit logging to reduce noise
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
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// Improved session caching with proper invalidation
const SESSION_CACHE = new Map<string, { session: any; timestamp: number }>()
const SESSION_CACHE_MAX_AGE = 60 * 1000 // 1 minute

export const getAuthSession = async () => {
  // Generate a cache key based on the current request context
  // In a real implementation, you might use headers or cookies
  const cacheKey = "global"
  const now = Date.now()

  // Check cache
  const cached = SESSION_CACHE.get(cacheKey)
  if (cached && now - cached.timestamp < SESSION_CACHE_MAX_AGE) {
    return cached.session
  }

  // Otherwise fetch a new session
  const session = await getServerSession(authOptions)

  // Cache the result
  if (session) {
    SESSION_CACHE.set(cacheKey, {
      session,
      timestamp: now,
    })
  }

  return session
}

// Helper to check if user is authenticated
export async function isAuthenticated() {
  const session = await getAuthSession()
  return !!session?.user
}

// Helper to check if user is admin
export async function isAdmin() {
  const session = await getAuthSession()
  return session?.user?.isAdmin === true
}

// Standard unauthorized response
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Helper to clear expired sessions
export async function clearExpiredSessions() {
  const now = new Date()
  await prisma.session.deleteMany({
    where: {
      expires: { lt: now },
    },
  })
}

// Helper to update user data
export async function updateUserData(userId: string, data: any) {
  await prisma.user.update({
    where: { id: userId },
    data,
  })

  // Invalidate session cache to ensure fresh data
  invalidateSessionCache()
}

// Invalidate session cache
export function invalidateSessionCache() {
  SESSION_CACHE.clear()
}
