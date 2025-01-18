import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import {LRUCache} from 'lru-cache';

const prisma = new PrismaClient();

// Initialize a simple in-memory cache
const cache = new LRUCache({
  max: 500, // Maximum items in cache
  ttl: 1000 * 60 * 5, // Cache lifetime: 5 minutes
});

export async function GET(request: Request) {
  const token = await getToken({ req: request as any });

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const userId = token.sub;

  // Check if data is cached
  const cacheKey = `user:${userId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return new Response(JSON.stringify(cachedData), { status: 200 });
  }

  try {
    // Fetch required user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        isAdmin: true,
        email: true,
        name: true,
        subscriptions: {
          select: {
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Format data
    const userData = {
      credits: user.credits,
      isAdmin: user.isAdmin,
      subscriptionStatus: user.subscriptions?.status || 'none',
      subscriptionEnd: user.subscriptions?.currentPeriodEnd || null,
    };

    // Store in cache
    cache.set(cacheKey, userData);

    return new Response(JSON.stringify(userData), { status: 200 });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
