import { DefaultSession, NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { NextResponse } from "next/server";
import { JWT } from "next-auth/jwt";
import { prisma } from "./db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      credits: number;
      isAdmin: boolean;
      userType: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    credits: number;
    isAdmin: boolean;
    planType: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user, trigger }: { token: JWT; user?: any; trigger?: string }) => {
      if (user) {
        // When the user signs in, fetch the latest data from the database
        const latestUserData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true, isAdmin: true, userType: true },
        });

        if (latestUserData) {
          token.id = user.id;
          token.credits = latestUserData.credits;
          token.isAdmin = latestUserData.isAdmin || false;
          token.planType = latestUserData.userType || "Free";
        }
      }

      if (trigger === "update") {
        // Refresh user data on token update
        const refreshedUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { credits: true, isAdmin: true, userType: true },
        });

        if (refreshedUser) {
          token.credits = refreshedUser.credits;
          token.isAdmin = refreshedUser.isAdmin;
          token.planType = refreshedUser.userType || "Free";
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.credits = token.credits;
        session.user.isAdmin = token.isAdmin;
        session.user.userType = token.planType;

        await prisma.session.updateMany({
          where: { userId: token.id },
          data: { lastUsed: new Date() },
        });
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      if (url === "/") return baseUrl;
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    signIn: async ({ user }) => {
      const now = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: now },
      });

      await prisma.session.updateMany({
        where: { userId: user.id },
        data: { lastUsed: now },
      });
    },
    signOut: async () => {
      await prisma.$executeRaw`DELETE FROM Session WHERE expires < CURRENT_TIMESTAMP`;
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
};

export const getAuthSession = () => getServerSession(authOptions);

export async function isAdmin() {
  const session = await getAuthSession();
  return session?.user?.isAdmin === true;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function clearExpiredSessions() {
  const now = new Date();
  await prisma.session.deleteMany({
    where: {
      OR: [
        { expires: { lt: now } },
        { lastUsed: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });
}

export async function updateUserData(userId: string, data: any) {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
}

