/**
 * Unified Middleware Service
 * Centralized middleware orchestration with feature flag integration
 */

import { NextRequest, NextResponse } from "next/server"
import { tokenCache } from './token-cache'
import { isFeatureEnabled, getFeatureResult, type FeatureFlagContext } from '../../lib/featureFlags'
import { matchRouteToFeature } from '../../config/feature-routes'

interface MiddlewareContext {
  request: NextRequest
  pathname: string
  isAuthenticated: boolean
  isAdmin: boolean
  userId?: string
  userPlan?: string
  token?: any
}

interface MiddlewareResult {
  response: NextResponse | null
  context: MiddlewareContext
  shouldContinue: boolean
  reason?: string
}

export class UnifiedMiddlewareService {
  private static instance: UnifiedMiddlewareService

  constructor() {
    // Initialize any needed services
  }

  static getInstance(): UnifiedMiddlewareService {
    if (!this.instance) {
      this.instance = new UnifiedMiddlewareService()
    }
    return this.instance
  }

  /**
   * Main middleware execution pipeline
   */
  async execute(req: NextRequest): Promise<MiddlewareResult> {
    const pathname = req.nextUrl.pathname
    
    // Create initial context
    let context: MiddlewareContext = {
      request: req,
      pathname,
      isAuthenticated: false,
      isAdmin: false
    }

    // 1. Check if middleware caching is enabled
    if (!isFeatureEnabled('middleware-caching')) {
      console.log('[UnifiedMiddleware] Token caching disabled by feature flag')
    }

    // 2. Get token and update context
    const tokenResult = await this.getTokenContext(req)
    context = { ...context, ...tokenResult }

    // 3. Check route-level feature flags
    const featureCheck = await this.checkRouteFeatures(context)
    if (featureCheck.response) {
      return featureCheck
    }

    // 4. Check authentication requirements
    const authCheck = await this.checkAuthentication(context)
    if (authCheck.response) {
      return authCheck
    }

    // 5. Check admin requirements
    const adminCheck = await this.checkAdminAccess(context)
    if (adminCheck.response) {
      return adminCheck
    }

    // 6. Check subscription/feature access
    const subscriptionCheck = await this.checkSubscriptionAccess(context)
    if (subscriptionCheck.response) {
      return subscriptionCheck
    }

    // All checks passed
    return {
      response: null,
      context,
      shouldContinue: true
    }
  }

  /**
   * Get token and create context
   */
  private async getTokenContext(req: NextRequest): Promise<Partial<MiddlewareContext>> {
    try {
      const token = await tokenCache.getCachedToken(req)
      const metadata = tokenCache.getTokenMetadata(token)

      return {
        isAuthenticated: metadata.isValid && !metadata.isExpired,
        isAdmin: metadata.isAdmin,
        userId: metadata.userId,
        userPlan: metadata.userPlan,
        token
      }
    } catch (error) {
      console.error('[UnifiedMiddleware] Token context error:', error)
      return {
        isAuthenticated: false,
        isAdmin: false
      }
    }
  }

  /**
   * Check route-level feature flags
   */
  private async checkRouteFeatures(context: MiddlewareContext): Promise<MiddlewareResult> {
    const routeConfig = matchRouteToFeature(context.pathname)
    
    if (!routeConfig) {
      return { response: null, context, shouldContinue: true }
    }

    // CRITICAL FIX: Check allowPublicAccess BEFORE enforcing feature flags
    // This allows users to explore creation pages without hitting subscription walls
    if (routeConfig.allowPublicAccess) {
      console.log(`[FeatureCheck] Public access allowed for exploration: ${context.pathname}`)
      // Feature flags will be enforced later when user actually performs restricted actions
      return { response: null, context, shouldContinue: true }
    }

    // Only enforce feature flags for non-public routes
    const flagContext: FeatureFlagContext = {
      userId: context.userId,
      userPlan: context.userPlan as any,
      environment: process.env.NODE_ENV as any,
      isAuthenticated: context.isAuthenticated,
      hasSubscription: context.userPlan !== 'FREE',
      hasCredits: true // This should be checked from user data
    }

    const featureResult = getFeatureResult(routeConfig.featureFlag, flagContext)
    
    if (!featureResult.enabled) {
      console.log(`[UnifiedMiddleware] Feature '${routeConfig.featureFlag}' disabled for route: ${context.pathname}`)
      
      const fallbackUrl = routeConfig.fallbackRoute || featureResult.fallbackRoute || '/dashboard'
      const response = this.createRedirect(fallbackUrl, context.request, featureResult.reason)
      
      return {
        response,
        context,
        shouldContinue: false,
        reason: featureResult.reason
      }
    }

    return { response: null, context, shouldContinue: true }
  }

  /**
   * Check authentication requirements
   */
  private async checkAuthentication(context: MiddlewareContext): Promise<MiddlewareResult> {
    // Check if route protection is enabled
    if (!isFeatureEnabled('route-protection')) {
      return { response: null, context, shouldContinue: true }
    }

    // Public static routes (no auth needed)
    const publicRoutes = [
      '/', '/about', '/pricing', '/terms', '/privacy', '/contactus',
      '/auth/signin', '/auth/signup', '/auth/signout', '/auth/error',
      '/unauthorized', '/unsubscribed'
    ]
    
    if (publicRoutes.some(route => context.pathname === route || context.pathname.startsWith(route))) {
      return { response: null, context, shouldContinue: true }
    }

    // CRITICAL: Check route config first - respect allowPublicAccess flag
    const routeConfig = matchRouteToFeature(context.pathname)
    if (routeConfig?.allowPublicAccess) {
      console.log(`[Auth] Public access allowed for exploration: ${context.pathname}`)
      return { response: null, context, shouldContinue: true }
    }

    // Routes that explicitly need authentication (not covered by routeConfig)
    const needsAuth = context.pathname.startsWith('/admin') ||
                     context.pathname === '/home' ||
                     context.pathname.startsWith('/dashboard/history') ||
                     context.pathname.startsWith('/dashboard/account') ||
                     context.pathname.startsWith('/dashboard/subscription')

    if (needsAuth && !context.isAuthenticated) {
      // Preserve full URL including query params for proper intent restoration
      const intentUrl = context.pathname + (context.request.nextUrl.search || '')
      const callbackUrl = encodeURIComponent(intentUrl)
      console.log(`[Auth Redirect] Saving intent: ${intentUrl}`)
      
      const response = this.createRedirect(`/auth/signin?callbackUrl=${callbackUrl}`, context.request, 'authentication_required')
      
      return {
        response,
        context,
        shouldContinue: false,
        reason: 'authentication_required'
      }
    }

    // Check token expiration
    if (context.isAuthenticated && context.token && tokenCache.isTokenExpired(context.token)) {
      // Preserve full URL including query params for proper intent restoration
      const intentUrl = context.pathname + (context.request.nextUrl.search || '')
      const callbackUrl = encodeURIComponent(intentUrl)
      console.log(`[Token Expired] Saving intent: ${intentUrl}`)
      
      const response = this.createRedirect(`/auth/signin?reason=expired&callbackUrl=${callbackUrl}`, context.request, 'token_expired')
      
      return {
        response,
        context,
        shouldContinue: false,
        reason: 'token_expired'
      }
    }

    return { response: null, context, shouldContinue: true }
  }

  /**
   * Check admin access requirements
   */
  private async checkAdminAccess(context: MiddlewareContext): Promise<MiddlewareResult> {
    if (!context.pathname.startsWith('/admin')) {
      return { response: null, context, shouldContinue: true }
    }

    // Check if admin panel is enabled
    if (!isFeatureEnabled('admin-panel')) {
      const response = this.createRedirect('/unauthorized?reason=feature_disabled', context.request, 'admin_panel_disabled')
      return {
        response,
        context,
        shouldContinue: false,
        reason: 'admin_panel_disabled'
      }
    }

    if (!context.isAdmin) {
      const response = this.createRedirect('/unauthorized?reason=admin', context.request, 'admin_required')
      return {
        response,
        context,
        shouldContinue: false,
        reason: 'admin_required'
      }
    }

    return { response: null, context, shouldContinue: true }
  }

  /**
   * Check subscription and feature access
   */
  private async checkSubscriptionAccess(context: MiddlewareContext): Promise<MiddlewareResult> {
    // Skip if subscription enforcement is disabled
    if (!isFeatureEnabled('subscription-enforcement')) {
      return { response: null, context, shouldContinue: true }
    }

    const routeConfig = matchRouteToFeature(context.pathname)
    if (!routeConfig) {
      return { response: null, context, shouldContinue: true }
    }

    // CRITICAL: Skip subscription check for public exploration routes
    // These routes handle their own subscription prompts at the action level
    if (routeConfig.allowPublicAccess) {
      console.log(`[SubscriptionCheck] Skipping subscription check for public route: ${context.pathname}`)
      return { response: null, context, shouldContinue: true }
    }

    // Check subscription requirements via feature flags
    const flagContext: FeatureFlagContext = {
      userId: context.userId,
      userPlan: context.userPlan as any,
      environment: process.env.NODE_ENV as any,
      isAuthenticated: context.isAuthenticated,
      hasSubscription: context.userPlan !== 'FREE',
      hasCredits: true // This should be fetched from user data
    }

    const featureResult = getFeatureResult(routeConfig.feature, flagContext)
    
    if (!featureResult.enabled) {
      const fallbackUrl = routeConfig.fallbackRoute || '/dashboard/subscription'
      const response = this.createRedirect(fallbackUrl, context.request, featureResult.reason)
      
      return {
        response,
        context,
        shouldContinue: false,
        reason: featureResult.reason
      }
    }

    return { response: null, context, shouldContinue: true }
  }

  /**
   * Create secure redirect response
   */
  private createRedirect(url: string, req: NextRequest, reason?: string): NextResponse {
    const response = NextResponse.redirect(new URL(url, req.url))
    
    // Add security headers
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    
    // Add custom headers for debugging
    if (reason) {
      response.headers.set("X-Redirect-Reason", reason)
    }
    
    return response
  }

  /**
   * Create response with security headers
   */
  createSecureResponse(): NextResponse {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
    response.headers.set("X-Protected-Route", "true")
    return response
  }

  /**
   * Handle clean logout scenarios
   */
  handleCleanLogout(req: NextRequest): NextResponse | null {
    const isCleanLogout = req.nextUrl.searchParams.has("cleanLogout")
    const logoutCookie = req.cookies.get("next-auth.logout-clean")
    
    if (isCleanLogout || logoutCookie?.value === "true") {
      const response = NextResponse.redirect(new URL("/", req.url))
      response.cookies.delete("next-auth.logout-clean")
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
      return response
    }

    return null
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheStats: any
    enabledFeatures: string[]
  } {
    return {
      cacheStats: tokenCache.getCacheStats(),
      enabledFeatures: isFeatureEnabled('performance-monitoring') ? 
        ['route-protection', 'subscription-enforcement', 'admin-panel'] : []
    }
  }
}

// Export singleton instance
export const unifiedMiddleware = UnifiedMiddlewareService.getInstance()