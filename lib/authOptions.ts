import { type DefaultSession, type DefaultUser, type NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { NextResponse } from "next/server"
import { type DefaultJWT, JWT } from "next-auth/jwt"
import { prisma } from "./db"

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
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (token.sub) {
        const userSubscription = await prisma.userSubscription.findUnique({
          where: { userId: token.sub },
        })

        token.user = {
          ...(token.user || {}),
          credits: userSubscription?.planId || 0,
          subscriptionPlan: userSubscription?.planId || "FREE",
          subscriptionStatus: userSubscription?.status || null,
        }
      }
   
      return token
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.credits = user.credits || 0
        session.user.isAdmin = user.isAdmin || false
        session.user.userType = user.userType || "Free"

        const subscription = await prisma.userSubscription.findUnique({
          where: { userId: user.id },
          select: { planId: true, status: true },
        })

        session.user.subscriptionPlan = subscription?.planId || null
        session.user.subscriptionStatus = subscription?.status || null
        session.user.accessToken =  session.user.accessToken;
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          userType: { set: user.userType || "Free" },
        },
      })
    },
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { userType: "Free" },
      })
    },
  },
  pages: {
    signIn: "/auth/signin",
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

