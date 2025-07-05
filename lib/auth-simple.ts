// Simplified auth configuration for debugging
import { type DefaultSession, type NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { prisma } from "./db"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      credits: number
      isAdmin: boolean
      userType: string
      subscriptionPlan: string | null
      subscriptionStatus: string | null
    } & DefaultSession["user"]
  }

  interface User {
    credits: number
    isAdmin: boolean
    userType: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    credits: number
    isAdmin: boolean
    userType: string
    subscriptionPlan: string | null
    subscriptionStatus: string | null
  }
}

export const authOptionsSimple: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('[SimpleAuth] JWT callback:', { token, user })
      
      // Initial sign in
      if (user) {
        token.id = user.id
        token.credits = user.credits || 0
        token.isAdmin = user.isAdmin || false
        token.userType = user.userType || "FREE"
        token.subscriptionPlan = null
        token.subscriptionStatus = "inactive"
        console.log('[SimpleAuth] Set initial token:', token)
        return token
      }

      // Subsequent requests - just return existing token for now
      return token
    },
    async session({ session, token }) {
      console.log('[SimpleAuth] Session callback:', { session, token })
      
      if (token && session.user) {
        session.user.id = token.id
        session.user.credits = token.credits || 0
        session.user.isAdmin = token.isAdmin || false
        session.user.userType = token.userType || "FREE"
        session.user.subscriptionPlan = token.subscriptionPlan || null
        session.user.subscriptionStatus = token.subscriptionStatus || null
      }
      
      console.log('[SimpleAuth] Final session:', session)
      return session
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log('[SimpleAuth] SignIn event:', { user, isNewUser })
      
      try {
        // For new users, set default values
        if (isNewUser) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              userType: "FREE",
              credits: 0,
              isAdmin: false,
            },
          })
          console.log('[SimpleAuth] Updated new user in database')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
          },
        })
      } catch (error) {
        console.error('[SimpleAuth] Error in signIn event:', error)
      }
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  debug: true, // Enable debug mode
}
