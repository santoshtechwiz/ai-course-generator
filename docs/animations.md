# Animation Components and UX Patterns

This document outlines the animation components and UX patterns available in the AI Learning platform.

## Available Animation Components

### `RevealImage`

A component that animates images as they enter the viewport.

```tsx
import { RevealImage } from '@/components/ui/animations';

<RevealImage 
  src="/path/to/image.jpg"
  alt="Image description"
  width={400}
  height={300}
  direction="left" // "left", "right", "top", "bottom"
  delay={0.2} // seconds
  priority={false} // for LCP images
  objectFit="cover" // "cover", "contain", "fill", "none", "scale-down"
  quality={80} // image quality 1-100
  threshold={0.3} // visibility threshold 0-1
/>
```

## Animation Best Practices

1. **Performance First**:
   - Use `priority` prop for LCP (Largest Contentful Paint) images
   - Keep animations simple and purposeful
   - Use `will-change` sparingly

2. **Accessibility**:
   - Respect user preferences with `prefers-reduced-motion`
   - Ensure sufficient contrast during and after animations
   - Avoid animations that flash or pulse rapidly

3. **UX Guidelines**:
   - Animations should enhance, not distract
   - Keep transitions under 300ms for UI interactions
   - Use consistent animation patterns across the application

## Example Usage Patterns

### Image Gallery with Reveal Animations

The `ImageGallery` component in `components/examples/image-gallery.tsx` demonstrates how to create a responsive gallery with staggered reveal animations.

### Page Transitions

For page transitions, use the following pattern:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={router.pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

## Framework Integration

The animation components are built with Framer Motion and are fully compatible with Next.js 13+ App Router and React Server Components architecture.
