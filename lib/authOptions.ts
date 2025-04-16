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
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Changed from "database" to "jwt" for better consistency
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
      }

      // On every JWT refresh, get the latest user data
      if (token.id) {
        try {
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
          }
        } catch (error) {
          console.error("Error fetching user data for JWT:", error)
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
  //debug: process.env.NODE_ENV === "development",
}

export const getAuthSession = () => getServerSession(authOptions)

export async function isAdmin() {
  const session = await getAuthSession()
  return session?.user?.isAdmin === true
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function clearExpiredSessions() {
  const now = new Date()
  await prisma.session.deleteMany({
    where: {
      expires: { lt: now },
    },
  })
}

export async function updateUserData(userId: string, data: any) {
  await prisma.user.update({
    where: { id: userId },
    data,
  })
}

