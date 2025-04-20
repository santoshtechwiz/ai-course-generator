/**
 * Payment Gateway Factory
 *
 * This file provides a factory function to get the configured payment gateway.
 * It supports multiple payment providers through a unified interface.
 */

import type { PaymentGateway } from "./payment-gateway-interface"
import { StripeGateway } from "./stripe-gateway"

/**
 * Get the configured payment gateway based on environment settings
 *
 * @returns The payment gateway implementation
 */
export function getPaymentGateway(): PaymentGateway {
  // Read from environment variable to determine which gateway to use
  const gatewayProvider = process.env.PAYMENT_GATEWAY_PROVIDER?.toLowerCase() || "stripe"

  // Select the appropriate gateway based on configuration
  switch (gatewayProvider) {
    case "stripe":
      return new StripeGateway()
    // Add additional payment gateways here as they are implemented
    // case 'paypal':
    //   return new PayPalGateway();
    default:
      console.warn(`Unknown payment gateway provider: ${gatewayProvider}. Defaulting to Stripe.`)
      return new StripeGateway()
  }
}

// Re-export the types from the interface for convenience
export type { PaymentOptions, CheckoutResult } from "./payment-gateway-interface"
