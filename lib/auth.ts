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
import { UserData } from "@/app/types/auth-types"

// Extend the default session type to include our custom fields
declare module "next-auth" {
  interface Session {
    user: UserData & {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
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
// Use a more robust approach with timestamps to handle race conditions
const activeRefreshes = new Map<string, { timestamp: number, promise?: Promise<any> }>()
// Cache to reduce DB load
const userCache = new Map<string, { data: any; timestamp: number }>()
const USER_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

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
      
      // Skip refresh if no userId
      if (!userId) return token

      if (shouldRefreshToken && refreshCount < 3) {
        try {
          // Check if there's already a refresh in progress for this user
          const existingRefresh = activeRefreshes.get(userId)
          
          // If there's a recent refresh in progress (within last 5 seconds), use its promise
          if (existingRefresh && now - existingRefresh.timestamp < 5000) {
            if (existingRefresh.promise) {
              await existingRefresh.promise
              // After the promise resolves, get the fresh user from cache
              const cachedUser = userCache.get(userId)
              if (cachedUser && now - cachedUser.timestamp < USER_CACHE_TTL) {
                const dbUser = cachedUser.data
                if (dbUser) {
                  token.credits = dbUser.credits
                  token.isAdmin = dbUser.isAdmin
                  token.userType = dbUser.userType
                  token.subscriptionPlan = dbUser.subscription?.planId || null
                  token.subscriptionStatus = dbUser.subscription?.status || null
                  token.updatedAt = now
                  token.refreshCount = 0
                }
                return token
              }
            }
            // If no promise or no cache hit, proceed with refresh
          }

          // Increment refresh count to prevent infinite loops
          token.refreshCount = refreshCount + 1

          // Create a new refresh promise
          const refreshPromise = (async () => {
            let dbUser
            // Check cache first
            const cachedUser = userCache.get(userId)

            if (cachedUser && now - cachedUser.timestamp < USER_CACHE_TTL) {
              dbUser = cachedUser.data
            } else {
              dbUser = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                  subscription: true,
                },
              })

              // Update cache
              if (dbUser) {
                userCache.set(userId, {
                  data: dbUser,
                  timestamp: now,
                })
              }
            }

            return dbUser
          })()

          // Store the promise in activeRefreshes
          activeRefreshes.set(userId, { 
            timestamp: now,
            promise: refreshPromise 
          })

          // Await the refresh promise
          const dbUser = await refreshPromise

          if (dbUser) {
            token.credits = dbUser.credits
            token.isAdmin = dbUser.isAdmin
            token.userType = dbUser.userType
            token.subscriptionPlan = dbUser.subscription?.planId || null
            token.subscriptionStatus = dbUser.subscription?.status || null
            token.updatedAt = now
            token.refreshCount = 0 // Reset count after successful refresh
          }

          // Clean up refresh tracking after a delay
          setTimeout(() => {
            const current = activeRefreshes.get(userId)
            if (current && current.timestamp === now) {
              activeRefreshes.delete(userId)
            }
          }, 10000) // 10 seconds cleanup delay
          
        } catch (error) {
          console.error("Error fetching user data for JWT:", error)
          // Don't update the token.updatedAt if there was an error
          
          // Clean up on error too
          const current = activeRefreshes.get(userId)
          if (current && current.timestamp === now) {
            activeRefreshes.delete(userId)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Only update session if necessary
        if (
          session.user.id !== token.id ||
          session.user.credits !== token.credits ||
          session.user.isAdmin !== token.isAdmin ||
          session.user.userType !== token.userType ||
          session.user.subscriptionPlan !== token.subscriptionPlan ||
          session.user.subscriptionStatus !== token.subscriptionStatus
        ) {
          session.user.id = token.id
          session.user.credits = token.credits || 0
          session.user.isAdmin = token.isAdmin || false
          session.user.userType = token.userType || "FREE"
          session.user.subscriptionPlan = token.subscriptionPlan || null
          session.user.subscriptionStatus = token.subscriptionStatus || null
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects more securely with additional validation
      
      // First ensure the url is a string to avoid type errors
      if (typeof url !== 'string' || typeof baseUrl !== 'string') {
        return baseUrl
      }
      
      // Create a safe list of allowed redirect domains
      const allowedOrigins = [
        new URL(baseUrl).origin,
        // Add other trusted domains if needed
      ]
      
      try {
        // Handle relative URLs
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`
        }
        
        // Check if URL is absolute and in our allowed list
        const urlObj = new URL(url)
        if (allowedOrigins.includes(urlObj.origin)) {
          return url
        }
        
        // If URL is not in allowed list, redirect to baseUrl
        return baseUrl
      } catch (error) {
        // If URL parsing fails, safely redirect to baseUrl
        console.error("Invalid redirect URL:", url, error)
        return baseUrl
      }
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
  ],
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// Improved session caching with proper invalidation
const SESSION_CACHE = new Map<string, { session: any; timestamp: number }>()
const SESSION_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

// Function to clear caches periodically with lock protection to avoid concurrent cleanups
let isClearingCache = false
const clearCaches = () => {
  if (isClearingCache) return
  isClearingCache = true
  
  try {
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
    
    // Clear stale refresh entries (older than 30 seconds)
    for (const [key, entry] of activeRefreshes.entries()) {
      if (now - entry.timestamp > 30000) {
        activeRefreshes.delete(key)
      }
    }
  } finally {
    isClearingCache = false
  }
}

// Set up periodic cache cleaning
if (typeof window === "undefined") {
  // Only run on server
  setInterval(clearCaches, 5 * 60 * 1000) // Clean every 5 minutes
}

/**
 * Gets the current authentication session safely in any context.
 * Avoids using headers() which requires a request context.
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
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

// Invalidate session cache
export function invalidateSessionCache(userId?: string) {
  if (userId) {
    // Only clear specific user's cache if provided
    SESSION_CACHE.delete(userId)
    userCache.delete(userId)
    const refresh = activeRefreshes.get(userId)
    if (refresh) activeRefreshes.delete(userId)
  } else {
    // Clear all caches
    SESSION_CACHE.clear()
    userCache.clear()
    activeRefreshes.clear()
  }
}

// Helper to update user data with proper cache invalidation
export async function updateUserData(userId: string, data: any) {
  if (!userId || typeof userId !== 'string') {
    throw new Error("Invalid user ID provided")
  }
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    })

    // Invalidate caches to ensure fresh data
    invalidateSessionCache(userId)
  } catch (error) {
    console.error("Error updating user data:", error)
    throw error
  }
}
