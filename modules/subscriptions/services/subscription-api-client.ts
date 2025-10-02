import { createApiClient } from "@/lib/api-client";

// Define subscription API endpoints with strong typing
const subscriptionEndpoints = {
  getStatus: () => '/api/subscriptions/status',
  getDetails: () => '/api/subscriptions',
  createSubscription: (data: any) => ({
    url: '/api/subscriptions/create',
    method: 'POST',
    data
  }),
  cancelSubscription: (subscriptionId: string) => ({
    url: '/api/subscriptions/cancel',
    method: 'POST',
    data: { subscriptionId }
  }),
  validatePromo: (promoCode: string) => ({
    url: '/api/subscriptions/validate-promo',
    method: 'POST',
    data: { promoCode }
  }),
  getPaymentMethods: () => '/api/account/payment-methods',
  getTokenUsage: () => '/api/tokens/usage',
  purchaseTokens: (tokenAmount: number) => ({
    url: '/api/subscriptions',
    method: 'POST',
    data: { action: 'purchase_tokens', tokenAmount }
  })
};

// Create the subscription API client
export const subscriptionApiClient = createApiClient('', subscriptionEndpoints);
