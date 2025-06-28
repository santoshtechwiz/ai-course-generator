/**
 * Payment Gateway Factory
 *
 * This file provides a factory function to get the configured payment gateway.
 * It supports multiple payment providers through a unified interface.
 */

import type { PaymentGateway } from "./payment-gateway-interface"
import { StripeGateway } from "./stripe-gateway"
import { logger } from "@/lib/logger"

/**
 * Get the configured payment gateway based on environment settings
 *
 * @returns The payment gateway implementation
 */
export function getPaymentGateway(): PaymentGateway {
  const gatewayProvider: string = process.env.PAYMENT_GATEWAY_PROVIDER?.toLowerCase() || "stripe"

  switch (gatewayProvider) {
    case "stripe":
      return new StripeGateway()
    // Add additional payment gateways here as they are implemented
    // case 'paypal':
    //   return new PayPalGateway();
    default:
      logger.warn(`Unknown payment gateway provider: ${gatewayProvider}. Defaulting to Stripe.`)
      return new StripeGateway()
  }
}

// Re-export the types from the interface for convenience
export type { PaymentOptions, CheckoutResult } from "./payment-gateway-interface"
