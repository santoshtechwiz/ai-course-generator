/**
 * Enhanced Payment Gateway Factory
 *
 * This file provides a factory function to get the configured payment gateway.
 * It supports multiple payment providers through a unified interface with
 * improved configuration management, caching, and error handling.
 */

import type { PaymentGateway, PaymentGatewayConfig } from "./payment-gateway-interface"
import { PaymentProvider, Currency } from "./payment-gateway-interface"
import { StripeGateway } from "./stripe-gateway"
import { PaymentConfigManager } from "./payment-config-manager"
import { logger } from "@/lib/logger"

/**
 * Gateway instances cache
 */
const gatewayCache = new Map<string, PaymentGateway>()

/**
 * Create a new gateway instance for the specified provider
 */
async function createGatewayInstance(provider: PaymentProvider): Promise<PaymentGateway | null> {
  const config = PaymentConfigManager.getConfig(provider)
  if (!config) {
    logger.error(`No valid configuration found for provider: ${provider}`)
    return null
  }

  let gateway: PaymentGateway

  switch (provider) {    case PaymentProvider.STRIPE:
      gateway = new StripeGateway()
      break

    // Add additional payment gateways here as they are implemented
    // case PaymentProvider.PAYPAL:
    //   gateway = new PayPalGateway()
    //   break
    
    // case PaymentProvider.SQUARE:
    //   gateway = new SquareGateway()
    //   break

    // case PaymentProvider.RAZORPAY:
    //   gateway = new RazorpayGateway()
    //   break

    default:
      logger.warn(`Gateway implementation not found for provider: ${provider}`)
      return null
  }

  try {
    await gateway.initialize(config)
    
    // Perform health check
    const isHealthy = await gateway.healthCheck()
    if (!isHealthy) {
      logger.error(`Health check failed for ${provider} gateway`)
      return null
    }

    logger.info(`Successfully initialized ${provider} gateway`)
    return gateway
  } catch (error) {
    logger.error(`Failed to initialize ${provider} gateway:`, error)
    return null
  }
}

/**
 * Get the configured payment gateway based on environment settings
 *
 * @param forceProvider - Override the default provider selection
 * @returns The payment gateway implementation
 */
export async function getPaymentGateway(forceProvider?: PaymentProvider): Promise<PaymentGateway> {
  const provider = forceProvider || 
    (process.env.PAYMENT_GATEWAY_PROVIDER?.toLowerCase() as PaymentProvider) || 
    PaymentProvider.STRIPE

  // Check cache first
  const cacheKey = `${provider}_${process.env.NODE_ENV}`
  if (gatewayCache.has(cacheKey)) {
    const cachedGateway = gatewayCache.get(cacheKey)!
    
    // Verify cached gateway is still healthy
    try {
      const isHealthy = await cachedGateway.healthCheck()
      if (isHealthy) {
        return cachedGateway
      } else {
        logger.warn(`Cached ${provider} gateway failed health check, recreating...`)
        gatewayCache.delete(cacheKey)
      }
    } catch (error) {
      logger.warn(`Error checking cached gateway health:`, error)
      gatewayCache.delete(cacheKey)
    }
  }

  // Try to create the requested gateway
  let gateway = await createGatewayInstance(provider)
  
  if (!gateway) {
    logger.warn(`Failed to create ${provider} gateway, falling back to Stripe`)
    
    // Fallback to Stripe if the requested provider fails
    if (provider !== PaymentProvider.STRIPE) {
      gateway = await createGatewayInstance(PaymentProvider.STRIPE)
    }
    
    if (!gateway) {
      throw new Error('No payment gateway could be initialized')
    }
  }

  // Cache the successful gateway
  gatewayCache.set(cacheKey, gateway)
  
  return gateway
}

/**
 * Get all available payment providers
 */
export function getAvailableProviders(): PaymentProvider[] {
  return PaymentConfigManager.getConfiguredProviders()
}

/**
 * Clear the gateway cache (useful for testing or configuration changes)
 */
export function clearGatewayCache(): void {
  gatewayCache.clear()
  logger.info('Payment gateway cache cleared')
}

/**
 * Get gateway health status for all configured providers
 */
export async function getGatewayHealthStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {}
  const providers = getAvailableProviders()
  
  for (const provider of providers) {
    try {
      const gateway = await getPaymentGateway(provider)
      status[provider] = await gateway.healthCheck()
    } catch (error) {
      status[provider] = false
    }
  }
  
  return status
}

// Re-export the types from the interface for convenience
export type { PaymentOptions, CheckoutResult } from "./payment-gateway-interface"
