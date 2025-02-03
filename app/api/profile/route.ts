import { getAuthSession } from '@/lib/authOptions';
import { prisma } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import NodeCache from 'node-cache';

// Initialize a simple in-memory cache using NodeCache
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes TTL with periodic check

export async function GET(request: Request) {

  const userId = (await getAuthSession())?.user.id;
  if(!userId) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

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
        subscription: {
          select: {
            status: true,
            planId: true,
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
      subscriptiontatus: user.subscription?.status || 'none',
      subscriptionEnd: user.subscription?.currentPeriodEnd || null,
      planId: user.subscription?.planId || null,
    };

    // Store in cache
    cache.set(cacheKey, userData);

    return new Response(JSON.stringify(userData), { status: 200 });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
