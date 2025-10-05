// src/server/auth.ts
import { type DefaultSession, type DefaultUser, type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import LinkedinProvider, { LinkedInProfile } from "next-auth/providers/linkedin"
import { prisma } from "./db"
import { sendEmail } from "@/lib/email"
import { NextResponse } from "next/server"

// -----------------------------
// Type Declarations
// -----------------------------
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      isActive?: boolean
      credits: number
      creditsUsed: number
      isAdmin: boolean
      userType: string
      subscriptionPlan: string | null
      subscriptionStatus: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    credits?: number
    creditsUsed?: number
    userType?: string
    isAdmin?: boolean
    isActive?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    credits: number
    creditsUsed: number
    isAdmin: boolean
    isActive: boolean
    userType: string
    subscriptionPlan: string | null
    subscriptionStatus: string | null
    updatedAt?: number
  }
}

// -----------------------------
// Cache Setup (safe, per-user)
// -----------------------------
const SESSION_CACHE = new Map<string, { session: any; timestamp: number }>()
const USER_CACHE = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// -----------------------------
// NextAuth Configuration
// -----------------------------
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  callbacks: {
    // --------------------------
    // JWT callback
    // --------------------------
    async jwt({ token, user, trigger }) {
      // Initial sign-in
      if (user) {
        token.id = user.id
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              credits: true,
              creditsUsed: true,
              isAdmin: true,
              isActive: true,
              userType: true,
              subscription: {
                select: { planId: true, status: true },
              },
            },
          })

          if (dbUser) {
            token.credits = dbUser.credits ?? 3
            token.creditsUsed = dbUser.creditsUsed ?? 0
            token.isAdmin = Boolean(dbUser.isAdmin)
            token.isActive = Boolean(dbUser.isActive ?? true)
            token.userType = dbUser.userType || "FREE"
            token.subscriptionPlan = dbUser.subscription?.planId || null
            token.subscriptionStatus = dbUser.subscription?.status || null
          } else {
            token.credits = 3
            token.creditsUsed = 0
            token.isAdmin = false
            token.userType = "FREE"
            token.isActive = true
          }
        } catch (err) {
          console.error("[JWT] Error fetching user:", err)
        }
        token.updatedAt = Date.now()
        return token
      }

      // Refresh token every hour
      const now = Date.now()
      if (token.updatedAt && now - token.updatedAt > 60 * 60 * 1000 && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              credits: true,
              creditsUsed: true,
              isAdmin: true,
              isActive: true,
              userType: true,
              subscription: {
                select: { planId: true, status: true },
              },
            },
          })
          if (dbUser) {
            token.credits = dbUser.credits ?? token.credits ?? 3
            token.creditsUsed = dbUser.creditsUsed ?? token.creditsUsed ?? 0
            token.isAdmin = Boolean(dbUser.isAdmin)
            token.isActive = Boolean(dbUser.isActive ?? true)
            token.userType = dbUser.userType || token.userType || "FREE"
            token.subscriptionPlan = dbUser.subscription?.planId || null
            token.subscriptionStatus = dbUser.subscription?.status || null
            token.updatedAt = now
          }
        } catch (err) {
          console.error("[JWT Refresh] Error fetching user:", err)
        }
      }

      return token
    },

    // --------------------------
    // Session callback
    // --------------------------
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.isActive = token.isActive
        session.user.credits = token.credits ?? 3
        session.user.creditsUsed = token.creditsUsed ?? 0
        session.user.isAdmin = token.isAdmin
        session.user.userType = token.userType || "FREE"
        session.user.subscriptionPlan = token.subscriptionPlan || null
        session.user.subscriptionStatus = token.subscriptionStatus || null
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      try {
        const redirectUrl = new URL(url, baseUrl)
        return redirectUrl.origin === baseUrl ? redirectUrl.href : baseUrl
      } catch {
        return baseUrl
      }
    },
  },

  // --------------------------
  // Events
  // --------------------------
  events: {
    async signIn({ user, isNewUser }) {
      try {
        const existingUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              name: user.name,
              credits: 3,
              creditsUsed: 0,
              userType: "FREE",
              isActive: true,
              isAdmin: false,
            },
          })
          if (user.email && user.name) {
            await sendEmail(user.email, user.name)
          }
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
          })
        }
      } catch (err) {
        console.error("[SignIn Event] Error:", err)
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
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_SECRET!,
    }),
    LinkedinProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      client: { token_endpoint_auth_method: "client_secret_post" },
      issuer: "https://www.linkedin.com",
      profile: (profile: LinkedInProfile) => ({
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        credits: 3,
        creditsUsed: 0,
        isAdmin: false,
        userType: "FREE",
      }),
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
}

// -----------------------------
// getAuthSession (safe caching)
// -----------------------------
export async function getAuthSession(options?: { skipCache?: boolean }) {
  const now = Date.now()

  if (!options?.skipCache) {
    const cached = SESSION_CACHE.get("global")
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.session
    }
  }

  try {
    // ✅ Modern App Router syntax (no req/res)
    const session = await getServerSession(authOptions)

    SESSION_CACHE.set("global", { session, timestamp: now })
    return session
  } catch (error) {
    console.error("[getAuthSession] Failed to fetch session:", error)
    return null
  }
}


// -----------------------------
// Cache Utilities
// -----------------------------
export function invalidateSessionCache(userId?: string) {
  try {
    if (userId) SESSION_CACHE.delete(`session:${userId}`)
    else SESSION_CACHE.clear()
  } catch (err) {
    console.error("[invalidateSessionCache] Error:", err)
  }
}

export function clearExpiredSessionCache() {
  const now = Date.now()
  for (const [key, entry] of SESSION_CACHE.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      SESSION_CACHE.delete(key)
    }
  }
}

export function isAdmin() {
  return new Promise<boolean>(async (resolve) => {
    const session = await getAuthSession()
    resolve(Boolean(session?.user?.isAdmin))
  })
}
