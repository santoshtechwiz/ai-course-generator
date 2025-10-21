/**
 * Payment Gateway Services Index
 * 
 * This file exports all payment gateway related services and utilities
 * for easy importing throughout the application.
 */

import { getAvailableProviders, getGatewayHealthStatus } from "./payment-gateway-factory"
import { PaymentProvider } from "./payment-gateway-interface"

// Core interfaces and types

export {
  PaymentProvider,
  
  
  
} from "./payment-gateway-interface"

// Factory and configuration




// Gateway implementations


// Webhook handling
export {
  PaymentWebhookHandler,
  
} from "./payment-webhook-handler"


// Main services



// Utilities and constants


/**
 * Initialize payment gateway services
 * Call this function during application startup to ensure
 * all payment gateways are properly configured
 */
async function initializePaymentServices(): Promise<{
  success: boolean
  message?: string
  configuredProviders: PaymentProvider[]
  healthStatus: Record<string, boolean>
}> {
  try {
    // Get all configured providers
    const configuredProviders = getAvailableProviders()
    
    if (configuredProviders.length === 0) {
      return {
        success: false,
        message: "No payment providers are configured",
        configuredProviders: [],
        healthStatus: {},
      }
    }

    // Check health status of all providers
    const healthStatus = await getGatewayHealthStatus()
    
    // Check if at least one provider is healthy
    const hasHealthyProvider = Object.values(healthStatus).some(status => status)
    
    if (!hasHealthyProvider) {
      return {
        success: false,
        message: "No payment providers are healthy",
        configuredProviders,
        healthStatus,
      }
    }

    return {
      success: true,
      message: `Successfully initialized ${configuredProviders.length} payment provider(s)`,
      configuredProviders,
      healthStatus,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize payment services: ${error instanceof Error ? error.message : String(error)}`,
      configuredProviders: [],
      healthStatus: {},
    }
  }
}

/**
 * Get payment service status
 * Useful for health checks and monitoring
 */
async function getPaymentServiceStatus(): Promise<{
  isHealthy: boolean
  providers: {
    name: PaymentProvider
    isConfigured: boolean
    isHealthy: boolean
  }[]
  summary: {
    totalProviders: number
    configuredProviders: number
    healthyProviders: number
  }
}> {
  const configuredProviders = getAvailableProviders()
  const healthStatus = await getGatewayHealthStatus()
  
  const providers = Object.values(PaymentProvider).map(provider => ({
    name: provider,
    isConfigured: configuredProviders.includes(provider),
    isHealthy: healthStatus[provider] || false,
  }))
  
  const healthyProviders = providers.filter(p => p.isHealthy).length
  
  return {
    isHealthy: healthyProviders > 0,
    providers,
    summary: {
      totalProviders: providers.length,
      configuredProviders: configuredProviders.length,
      healthyProviders,
    },
  }
}
