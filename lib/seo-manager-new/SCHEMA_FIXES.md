# Schema.org Structured Data Fixes

This document details fixes applied to Schema.org structured data in the SEO Manager.

## 1. BreadcrumbList Item Format Fix (July 5, 2025)

### Problem

Google Search Console reported an error with our BreadcrumbList structured data:

```
Invalid items detected
Invalid items are not eligible for Google Search's rich results.

Details:
- Unnamed item
- 1 critical issue
- Either 'name' or 'item.name' should be specified
```

The issue was in how we formatted the `item` property in the BreadcrumbList schema. We were incorrectly providing a URL string directly to the `item` property, rather than an object with a proper `@type` and `name`.

### Fix Applied

In both the component-based and functional generators, we updated the `item` property to include the required name:

#### Previous (incorrect) format:

```javascript
itemListElement: breadcrumbItems.map(item => ({
  "@type": "ListItem",
  position: item.position,
  name: item.name,
  item: item.url,  // Just a URL string
}))
```

#### New (correct) format:

```javascript
itemListElement: breadcrumbItems.map(item => ({
  "@type": "ListItem",
  position: item.position,
  name: item.name,
  item: {
    "@type": "Thing",
    "@id": item.url,
    name: item.name  // Added name property to satisfy Google's requirement
  },
}))
```

### Files Fixed

- `lib/seo-manager/structured-data/components.tsx`: Fixed the BreadcrumbListSchema component
- `lib/seo-manager/structured-data/generators.ts`: Fixed the generateBreadcrumbSchema function

### Testing

The fix was tested by running the development server and verifying that the BreadcrumbList schema now includes the proper `name` property in the `item` object.

### References

- [Schema.org BreadcrumbList documentation](https://schema.org/BreadcrumbList)
- [Google Search Console Rich Results Test](https://search.google.com/test/rich-results)
