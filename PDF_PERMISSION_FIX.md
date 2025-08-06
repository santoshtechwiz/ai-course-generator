# PDF Download Permission Fix

## Problem
The PDF download button was not showing as enabled for quiz owners and users with active subscriptions due to restrictive permission logic.

## Root Causes
1. **Subscription Logic**: `canDownloadPdf` was tied to `subscription?.features?.advancedAnalytics` which didn't exist
2. **Owner Permissions**: The system wasn't considering content ownership for PDF downloads
3. **Inconsistent Checks**: Different components had different permission logic

## Changes Made

### 1. Updated `useSubscription` Hook
**File**: `hooks/use-subscription.ts`

- **Fixed subscription detection**:
  ```typescript
  // Before: subscription?.features?.advancedAnalytics || false
  // After: 
  const canDownloadPdf = isSubscribed || 
    subscription?.plan === "BASIC" || 
    subscription?.plan === "PREMIUM" || 
    subscription?.plan === "PRO"
  ```

- **Simplified refresh logic**: Removed dependency on non-existent `refreshSubscriptionData`
- **Better plan-based limits**: Replaced feature-based tokens with plan-based limits

### 2. Enhanced `UnifiedPdfGenerator` Component
**File**: `components/shared/UnifiedPdfGenerator.tsx`

- **Added `isOwner` prop**: Allows owners to download PDFs regardless of subscription
  ```typescript
  interface UnifiedPdfGeneratorProps {
    // ... existing props
    isOwner?: boolean // NEW: Allow owners to download PDFs
  }
  ```

- **Updated permission logic**:
  ```typescript
  // Allow download if user has subscription OR is the owner
  const canDownload = canDownloadPdf || isOwner
  const isDisabled = !canDownload || !isDataReady || isDownloading || !isClient
  ```

- **Improved tooltip messages**:
  ```typescript
  const tooltipContent = canDownload
    ? `Download this ${type} as a PDF file`
    : isOwner 
      ? "Download available for content owners"
      : "Upgrade your subscription to enable PDF downloads"
  ```

### 3. Updated All PDF Components
**Files Updated**:
- `app/dashboard/(quiz)/components/QuizActions.tsx`
- `app/dashboard/create/components/QuizPdfButton.tsx`
- `app/dashboard/(quiz)/document/components/DocumentQuizPdf.tsx`
- `app/dashboard/(quiz)/document/components/DocumentQuizDisplay.tsx`
- `components/shared/PDFGenerator.tsx`

**Changes**:
- Added `isOwner?: boolean` prop to all component interfaces
- Passed `isOwner={isOwner}` prop to `UnifiedPdfGenerator`
- Maintained backward compatibility with default `isOwner = false`

### 4. QuizActions Integration
**File**: `app/dashboard/(quiz)/components/QuizActions.tsx`

- **Desktop View**:
  ```tsx
  <UnifiedPdfGenerator
    data={pdfData}
    type={getPdfType()}
    config={pdfConfig}
    isOwner={isOwner} // NEW: Pass owner status
    // ... other props
  />
  ```

- **Mobile View**: Same `isOwner` prop added to mobile PDF component

## Permission Matrix

| User Type | Subscription | Can Download PDF | Reason |
|-----------|-------------|------------------|---------|
| Owner | Any | ✅ Yes | Content ownership |
| Non-Owner | FREE | ❌ No | Requires subscription |
| Non-Owner | BASIC/PREMIUM/PRO | ✅ Yes | Active subscription |
| Non-Owner | BASIC/PREMIUM/PRO + Cancelled | ✅ Yes | Still active until period end |

## Testing Scenarios

### ✅ Test Cases to Verify
1. **Owner with FREE plan** → Should see enabled PDF download button
2. **Owner with paid plan** → Should see enabled PDF download button  
3. **Non-owner with FREE plan** → Should see disabled PDF download button with upgrade prompt
4. **Non-owner with BASIC plan** → Should see enabled PDF download button
5. **Non-owner with PREMIUM plan** → Should see enabled PDF download button
6. **Non-owner with PRO plan** → Should see enabled PDF download button

### 🎯 Specific Fix Validation
- Navigate to any quiz you own → PDF download should be enabled regardless of subscription
- Navigate to any quiz with an active subscription → PDF download should be enabled
- Navigate to any quiz without subscription and not owned → Should show "Upgrade to Download"

## Backward Compatibility
- ✅ All existing PDF functionality preserved
- ✅ No breaking changes to component interfaces
- ✅ Default behavior unchanged for components not passing `isOwner`
- ✅ Subscription logic more permissive (fewer false negatives)

## Benefits
1. **Owners can always download** their content PDFs
2. **Active subscribers** can download PDFs as expected
3. **Clear permission logic** that's easy to understand and maintain
4. **Better user experience** with appropriate tooltips and messaging
5. **Consistent behavior** across all PDF download components
