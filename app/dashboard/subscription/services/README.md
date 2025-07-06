# Payment Gateway System

This document describes the payment gateway system that provides a unified interface for multiple payment providers with improved security, error handling, and extensibility.

## Overview

The payment gateway system consists of several key components:

1. **Payment Gateway Interface** - Defines the contract all payment providers must implement
2. **Payment Gateway Factory** - Creates and manages payment gateway instances
3. **Configuration Manager** - Handles environment-specific configuration and validation
4. **Stripe Gateway** - Improved Stripe implementation with better error handling
5. **Webhook Handler** - Processes payment webhooks with proper validation
6. **Security Utilities** - Provides security features like data sanitization

## Key Features

### 🔐 Security
- API key validation and environment-specific configuration
- Webhook signature validation
- Sensitive data sanitization for logging
- Idempotency key generation
- Input validation and sanitization

### 🚀 Performance
- Intelligent caching with TTL
- Connection pooling and retry mechanisms
- Optimized database queries
- Background processing for webhooks

### 🛠 Extensibility
- Support for multiple payment providers (Stripe, PayPal, Square, Razorpay)
- Plugin-based architecture for easy provider addition
- Configurable payment options and metadata
- Flexible webhook event handling

### 🔍 Monitoring
- Comprehensive logging
- Health checks for all providers
- Performance metrics and caching statistics
- Error tracking and retry mechanisms

## Architecture

```
┌─────────────────────┐
│   Application       │
├─────────────────────┤
│   Service Layer     │ ← SubscriptionService, TokenService
├─────────────────────┤
│   Gateway Factory   │ ← Payment Gateway Factory
├─────────────────────┤
│   Gateway Interface │ ← Unified Payment Interface
├─────────────────────┤
│   Implementations   │ ← Stripe, PayPal, Square, etc.
└─────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { getPaymentGateway, PaymentProvider } from './services'

// Get the default configured gateway
const gateway = await getPaymentGateway()

// Get a specific provider
const stripeGateway = await getPaymentGateway(PaymentProvider.STRIPE)

// Create a checkout session
const result = await gateway.createCheckoutSession(
  'user-id',
  'premium-plan',
  12, // duration in months
  {
    customerEmail: 'user@example.com',
    promoCode: 'SAVE20',
    referralCode: 'REF123'
  }
)
```

### Configuration

Set environment variables for your payment providers:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Square Configuration
SQUARE_ACCESS_TOKEN=...
SQUARE_APPLICATION_SECRET=...

# Razorpay Configuration
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# General Configuration
PAYMENT_GATEWAY_PROVIDER=stripe
NODE_ENV=production
```

### Webhook Handling

```typescript
import { PaymentWebhookHandler, PaymentProvider } from './services'

// Process a webhook
const result = await PaymentWebhookHandler.processWebhook(
  PaymentProvider.STRIPE,
  requestBody,
  signature,
  headers
)

if (result.success) {
  console.log('Webhook processed successfully')
} else {
  console.error('Webhook processing failed:', result.error)
}
```

### Health Monitoring

```typescript
import { getPaymentServiceStatus, initializePaymentServices } from './services'

// Initialize services on startup
const initResult = await initializePaymentServices()
console.log('Payment services initialized:', initResult)

// Check service health
const status = await getPaymentServiceStatus()
console.log('Service status:', status)
```

## Supported Payment Providers

### ✅ Stripe
- Full implementation with all features
- Webhook support
- Multiple payment methods
- Subscription management
- Billing history

### 🚧 PayPal (Planned)
- Basic configuration ready
- Implementation in progress

### 🚧 Square (Planned)
- Basic configuration ready
- Implementation in progress

### 🚧 Razorpay (Planned)
- Basic configuration ready
- Implementation in progress

## API Reference

### PaymentGateway Interface

```typescript
interface PaymentGateway {
  getProvider(): PaymentProvider
  initialize(config: PaymentGatewayConfig): Promise<void>
  healthCheck(): Promise<boolean>
  createCheckoutSession(userId: string, planName: string, duration: number, options?: PaymentOptions): Promise<CheckoutResult>
  cancelSubscription(userId: string, immediate?: boolean): Promise<boolean>
  resumeSubscription(userId: string): Promise<boolean>
  verifyPaymentStatus(sessionId: string): Promise<PaymentStatusResult>
  getPaymentMethods(userId: string): Promise<PaymentMethodInfo[]>
  updateSubscription(userId: string, planName: string): Promise<boolean>
  getBillingHistory(userId: string, limit?: number): Promise<BillingHistoryItem[]>
  // ... additional methods
}
```

### Payment Options

```typescript
interface PaymentOptions {
  referralCode?: string
  promoCode?: string
  promoDiscount?: number
  metadata?: Record<string, string>
  customerEmail?: string
  customerName?: string
  currency?: Currency
  successUrl?: string
  cancelUrl?: string
  collectShipping?: boolean
  collectBilling?: boolean
  taxPercentage?: number
  trialPeriodDays?: number
}
```

## Error Handling

The system provides comprehensive error handling:

- **Configuration Errors**: Invalid or missing API keys
- **Network Errors**: Connection timeouts and retries
- **Validation Errors**: Invalid input parameters
- **Payment Errors**: Card declines, insufficient funds, etc.
- **Webhook Errors**: Invalid signatures, duplicate events

All errors are properly logged with sanitized data to prevent sensitive information leakage.

## Security Considerations

1. **API Key Management**: Store keys securely in environment variables
2. **Webhook Validation**: Always validate webhook signatures
3. **Data Sanitization**: Sensitive data is automatically sanitized in logs
4. **Input Validation**: All inputs are validated before processing
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **HTTPS Only**: All payment operations require HTTPS

## Performance Optimizations

1. **Caching**: Gateway instances and frequently accessed data are cached
2. **Connection Pooling**: Reuse connections to payment providers
3. **Retry Logic**: Automatic retries for transient failures
4. **Background Processing**: Webhooks are processed asynchronously
5. **Database Optimization**: Efficient queries with proper indexing

## Testing

The system includes comprehensive testing utilities:

- Mock payment gateways for development
- Test webhook handlers
- Configuration validation tests
- Integration tests with Stripe test mode

## Migration Guide

If you're migrating from the old payment system:

1. Update your imports to use the new service exports
2. Handle the async factory function calls
3. Update webhook endpoints to use the new handler
4. Set up proper environment configuration
5. Test thoroughly in a development environment

## Troubleshooting

### Common Issues

1. **Gateway Not Initialized**: Ensure environment variables are set correctly
2. **Health Check Failures**: Check network connectivity and API keys
3. **Webhook Validation Failures**: Verify webhook signatures and endpoints
4. **Configuration Errors**: Use the validation utilities to check setup

### Debugging

Enable debug logging by setting:
```bash
DEBUG=payment-gateway:*
```

### Monitoring

Monitor these metrics:
- Gateway health status
- Cache hit rates
- Error rates by provider
- Webhook processing times

## Contributing

When adding a new payment provider:

1. Implement the `PaymentGateway` interface
2. Add configuration in `PaymentConfigManager`
3. Update the factory to include your provider
4. Add webhook parsing logic if supported
5. Include comprehensive tests
6. Update this documentation

## Support

For issues and questions:
- Check the troubleshooting section
- Review the logs for error details
- Ensure all environment variables are properly set
- Test with the provider's sandbox/test environment first
