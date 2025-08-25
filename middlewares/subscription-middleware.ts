import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/config/subscription-routes'

export async function validateSubscriptionMiddleware(req: NextRequest) {
  // Public routes don't need subscription validation
  if (PUBLIC_ROUTES.some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route requires subscription
  const needsSubscription = PROTECTED_ROUTES.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (!needsSubscription) {
    return NextResponse.next()
  }

  try {
    // Only validate subscription for protected routes
    const response = await fetch('/api/subscriptions/validate', {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    })

    if (!response.ok) {
      // Redirect to subscription page if validation fails
      return NextResponse.redirect(new URL('/dashboard/subscription', req.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Subscription validation failed:', error)
    return NextResponse.next()
  }
}
