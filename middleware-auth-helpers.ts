/**
 * middleware-auth-helpers.ts
 * 
 * This file contains utilities for handling authentication in middleware,
 * which helps to centralize auth logic and reduce duplicate code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/course',
  '/dashboard/profile',
  '/dashboard/subscription',
  '/course',
]

// Routes that require admin access
export const ADMIN_ROUTES = [
  '/admin',
]

// Public routes that should never redirect to auth
export const PUBLIC_ROUTES = [
  '/api',
  '/auth',
  '/explore',
  '/_next',
  '/favicon',
  '/public',
  '/images',
  '/fonts',
]

/**
 * Check if a route is protected and requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route requires admin access
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is public and should never redirect
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Get auth token from request with proper error handling
 */
export async function getAuthToken(req: NextRequest) {
  try {
    return await getToken({
      req,
      secureCookie: process.env.NODE_ENV === 'production',
    })
  } catch (error) {
    console.error('Error getting auth token in middleware:', error)
    return null
  }
}

/**
 * Check for clean logout indicators to prevent auto-relogin
 */
export function isCleanLogout(req: NextRequest): boolean {
  // Check URL parameters
  const hasLogoutParam = req.nextUrl.searchParams.has('logout') || 
                         req.nextUrl.searchParams.has('cleanLogout')
  
  // Check cookies for logout flags 
  const logoutCookie = req.cookies.get('next-auth.logout-clean')?.value === 'true'
  
  // Check localStorage flag through cookies (set by the logout function)
  const authCookie = req.cookies.get('auth-logout-flag')?.value === 'true'
  
  return hasLogoutParam || logoutCookie || authCookie
}

/**
 * Create unauthorized response with proper headers
 */
export function createUnauthorizedResponse(req: NextRequest, reason?: string): NextResponse {
  const url = new URL('/unauthorized', req.url)
  if (reason) {
    url.searchParams.set('reason', reason)
  }
  
  const response = NextResponse.redirect(url)
  
  // Add strong cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * Create a next response with proper cache headers for authenticated content
 */
export function createAuthResponse(): NextResponse {
  const response = NextResponse.next()
  
  // Set cache headers to prevent caching authenticated content
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}
