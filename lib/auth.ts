import { DefaultSession, NextAuthOptions, getServerSession } from "next-auth";
import { prisma } from "./db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { NextResponse } from "next/server";
import { JWT } from "next-auth/jwt";
import { LRUCache } from "lru-cache";

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

const CACHE_TTL = 3600; // 1 hour in seconds

const userCache = new LRUCache<string, any>({
  max: 500, // Maximum number of items to store in the cache
  ttl: CACHE_TTL * 1000, // TTL in milliseconds
});

async function getUserFromCache(userId: string) {
  return userCache.get(userId) || null;
}

async function setUserCache(userId: string, userData: any) {
  userCache.set(userId, userData);
}

async function clearUserCache(userId: string) {
  userCache.delete(userId);
}

export const authOptions: NextAuthOptions = {
  events: {
    signIn: async ({ user }) => {
      const now = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: now },
      });

      const latestSession = await prisma.session.findFirst({
        where: { userId: user.id },
        orderBy: { expires: 'desc' },
      });

      if (latestSession) {
        await prisma.session.update({
          where: { id: latestSession.id },
          data: { lastUsed: now },
        });
      }

      await clearUserCache(user.id);
    },
    signOut: async ({ session }) => {
      await prisma.$executeRaw`DELETE FROM Session WHERE expires < CURRENT_TIMESTAMP`;
      if (session?.user?.id) {
        await clearUserCache(session.user.id);
      }
      const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
      response.cookies.delete('idToken');
      response.cookies.delete('refreshToken');
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user, trigger }: { token: JWT; user?: any; trigger?: string }) => {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin || false;
        token.planType = user.userType || "Free";
        await setUserCache(user.id, { credits: user.credits, isAdmin: user.isAdmin, userType: user.userType });
      }

      if (trigger === "update" || !token.credits) {
        const cachedUser = await getUserFromCache(token.id);
        if (cachedUser) {
          token.credits = cachedUser.credits;
          token.isAdmin = cachedUser.isAdmin;
          token.planType = cachedUser.userType;
        } else {
          const refreshedUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { credits: true, isAdmin: true, userType: true },
          });

          if (refreshedUser) {
            token.credits = refreshedUser.credits;
            token.isAdmin = refreshedUser.isAdmin;
            token.planType = refreshedUser.userType || "Free";
            await setUserCache(token.id, refreshedUser);
          }
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
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
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
  pages: {
    signIn: "/auth/signin",
  },
};

export const getAuthSession = () => {
  return getServerSession(authOptions);
};

export async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin === true;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function clearExpiredSessions() {
  const now = new Date();
  const expiredSessions = await prisma.session.findMany({
    where: {
      OR: [
        { expires: { lt: now } },
        { lastUsed: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      ],
    },
    select: { userId: true },
  });

  await prisma.session.deleteMany({
    where: {
      OR: [
        { expires: { lt: now } },
        { lastUsed: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  for (const session of expiredSessions) {
    await clearUserCache(session.userId);
  }
}

export async function updateUserData(userId: string, data: any) {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
  await clearUserCache(userId);
}

