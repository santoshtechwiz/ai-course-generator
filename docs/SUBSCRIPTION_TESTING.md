# Subscription Testing Instructions

## Overview
The subscription system now includes feature flags that allow you to test different subscription scenarios without changing your actual subscription data.

## Quick Testing Setup

### 1. Enable the Test Panel
The `SubscriptionTestPanel` is automatically available in development mode. Look for the orange "🧪 Subscription Test Panel" in the bottom-right corner of your dashboard.

### 2. Test "Subscribed but Not Active" Scenario

To test the specific scenario you requested, modify the `SUBSCRIPTION_TEST_FLAGS` in `hooks/use-subscription.ts`:

```typescript
const SUBSCRIPTION_TEST_FLAGS = {
  // Set to true to simulate having a subscription but inactive status
  SIMULATE_SUBSCRIBED_BUT_INACTIVE: true, // ← Change this to true
  OVERRIDE_PLAN: null,
  OVERRIDE_STATUS: null,
  FORCE_PDF_DOWNLOAD: null,
}
```

### 3. Other Test Scenarios

**Test Premium Plan with Inactive Status:**
```typescript
const SUBSCRIPTION_TEST_FLAGS = {
  SIMULATE_SUBSCRIBED_BUT_INACTIVE: false,
  OVERRIDE_PLAN: "PREMIUM", // ← Force premium plan
  OVERRIDE_STATUS: "inactive", // ← But inactive status
  FORCE_PDF_DOWNLOAD: null,
}
```

**Force PDF Download Off (Test Restrictions):**
```typescript
const SUBSCRIPTION_TEST_FLAGS = {
  SIMULATE_SUBSCRIBED_BUT_INACTIVE: false,
  OVERRIDE_PLAN: null,
  OVERRIDE_STATUS: null,
  FORCE_PDF_DOWNLOAD: false, // ← Force PDF downloads to be disabled
}
```

**Test Free Plan:**
```typescript
const SUBSCRIPTION_TEST_FLAGS = {
  SIMULATE_SUBSCRIBED_BUT_INACTIVE: false,
  OVERRIDE_PLAN: "FREE", // ← Force free plan
  OVERRIDE_STATUS: "active",
  FORCE_PDF_DOWNLOAD: null,
}
```

## What to Test

1. **PDF Download Permissions:**
   - Try downloading PDFs from quiz results
   - Check if the download button is enabled/disabled correctly
   - Verify owner permissions still work (you should always be able to download your own content)

2. **Subscription Status Display:**
   - Check subscription badges and status indicators
   - Verify plan limitations are shown correctly

3. **Debug Information:**
   - Use the test panel to see original vs. test subscription data
   - Review the permission calculation logic
   - Check that flags are being applied correctly

## Steps to Test

1. **Set Flags:** Update `SUBSCRIPTION_TEST_FLAGS` in `hooks/use-subscription.ts`
2. **Reload Page:** The test panel has a reload button, or just refresh manually
3. **Check Test Panel:** Expand the test panel to see current state and debug info
4. **Test Functionality:** Try downloading PDFs, check subscription-related features
5. **Reset Flags:** Set all flags back to `false/null` when done testing

## Important Notes

- **Development Only:** Test flags only work in development mode
- **Owner Override:** As the content owner, you should always be able to download PDFs regardless of subscription status
- **Page Reload Required:** Changes to test flags require a page reload to take effect
- **Real Data Preserved:** Test flags don't modify your actual subscription data

## Debugging

The test panel shows detailed debug information including:
- Original subscription data
- Test-modified subscription data  
- Calculated permissions
- Flag status

Use this information to understand how the subscription logic is working and verify your tests are behaving as expected.
