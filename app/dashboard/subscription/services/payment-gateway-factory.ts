/**
 * Payment Gateway Factory
 *
 * This file provides a factory function to get the configured payment gateway.
 */

import type { PaymentGateway } from "./payment-gateway-interface"
import { StripeGateway } from "./stripe-gateway"

/**
 * Get the configured payment gateway
 *
 * @returns The payment gateway implementation
 */
export function getPaymentGateway(): PaymentGateway {
  // This would normally determine which gateway to use based on configuration
  // For now, we'll return the Stripe gateway
  return new StripeGateway()
}

// Re-export the types from the interface
export type { PaymentOptions } from "./payment-gateway-interface"
