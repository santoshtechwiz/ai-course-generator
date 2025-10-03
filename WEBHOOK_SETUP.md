# Webhook Setup Guide

## Current Issue
The webhook processing is failing with these errors:
- `[WARN] Gateway does not support webhook validation`
- `[INFO] Ignoring Stripe event type: invoice_payment.paid`
- `[ERROR] Webhook processing failed: Failed to parse webhook event`

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Stripe Price IDs (optional for development)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ULTIMATE_PRICE_ID=price_...
```

## Getting Your Stripe Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint (or create one if you don't have it)
3. Your webhook URL should be: `https://your-domain.com/api/webhook`
4. Copy the "Signing secret" which starts with `whsec_`
5. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Webhook Events to Listen For

Configure your Stripe webhook to listen for these events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.updated`

## Development Testing

For local development, you can:

1. **Use Stripe CLI** (recommended):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   This will give you a webhook secret that starts with `whsec_`

2. **Skip webhook validation** (for testing only):
   Set `STRIPE_WEBHOOK_SECRET=""` (empty string) to skip validation

## Fixed Issues

✅ **Added proper webhook validation** to StripeGateway
✅ **Fixed event type mapping** for `invoice_payment.paid` → `invoice.payment_succeeded`
✅ **Improved error logging** with more detailed debugging information
✅ **Enhanced provider detection** with better header checking
✅ **Better payload validation** with structured error messages

## Testing the Fix

1. Set up the environment variables above
2. Restart your development server
3. Trigger a test webhook from Stripe dashboard
4. Check the logs - you should see successful processing instead of errors

## Production Deployment

For production:
1. Use live Stripe keys (`sk_live_` and `whsec_`)
2. Ensure your webhook endpoint is accessible
3. Set up proper SSL/TLS certificates
4. Monitor webhook delivery in Stripe dashboard