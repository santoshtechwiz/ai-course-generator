# Centralized Animation System

This document outlines the new centralized animation system for the CourseAI platform, designed to replace scattered Framer Motion usage with reusable, consistent components.

## Overview

The animation system consists of:
- **useAnimationFrame**: Hook for performant requestAnimationFrame animations
- **MotionProvider**: Global motion configuration and AnimatePresence wrapper
- **AnimatedWrapper**: Reusable component for common animation patterns

## Quick Start

### 1. Import the components

```tsx
import { AnimatedWrapper, FadeIn, SlideUp, StaggeredList } from '@/components/animations'
```

### 2. Use pre-built animation components

```tsx
// Simple fade-in animation
<FadeIn>
  <h1>Welcome to CourseAI</h1>
</FadeIn>

// Slide up with custom delay
<SlideUp delay={0.2}>
  <Card>Course content</Card>
</SlideUp>

// Staggered list animation
<StaggeredList>
  {items.map(item => (
    <div key={item.id}>{item.title}</div>
  ))}
</StaggeredList>
```

### 3. Use the flexible AnimatedWrapper

```tsx
<AnimatedWrapper
  animation="scale"
  delay={0.3}
  duration={0.5}
  className="my-custom-class"
>
  <YourComponent />
</AnimatedWrapper>
```

## Available Animations

### Pre-built Components
- **FadeIn**: Simple opacity fade-in
- **SlideUp**: Slide from bottom with fade
- **SlideDown**: Slide from top with fade
- **Scale**: Scale and fade animation
- **Bounce**: Spring-based bounce animation

### Custom Animations
Use `AnimatedWrapper` with these animation types:
- `fadeIn`
- `slideUp`
- `slideDown`
- `slideLeft`
- `slideRight`
- `scale`
- `bounce`
- `none` (no animation)

## Advanced Usage

### Custom Animation Hooks

```tsx
import { useAnimationFrame, useSmoothValue } from '@/components/animations'

// Smooth value transitions
const smoothValue = useSmoothValue(targetValue, 300)

// Custom animation loop
useAnimationFrame((deltaTime, timestamp) => {
  // Your animation logic here
}, { fps: 60 })
```

### Staggered Animations

```tsx
<StaggeredList staggerDelay={0.1} className="grid grid-cols-3 gap-4">
  {courses.map(course => (
    <CourseCard key={course.id} {...course} />
  ))}
</StaggeredList>
```

### Conditional Animations

```tsx
<AnimatedWrapper
  animation={isVisible ? "slideUp" : "none"}
  once={false}
>
  <Content />
</AnimatedWrapper>
```

## Migration Guide

### Before (scattered motion components)
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <Content />
</motion.div>
```

### After (centralized system)
```tsx
import { SlideUp } from '@/components/animations'

<SlideUp>
  <Content />
</SlideUp>
```

## Performance Benefits

1. **Lazy Loading**: Motion components are loaded only when needed
2. **Reduced Motion Support**: Automatically respects user preferences
3. **Optimized Re-renders**: Centralized state management
4. **Consistent Timing**: Standardized animation durations and easing
5. **SSR Safe**: No hydration mismatches

## Best Practices

1. **Use semantic animation names**: Choose animations that match the content's purpose
2. **Keep animations subtle**: Avoid overwhelming users with too many animations
3. **Test on reduced motion**: Ensure content is accessible without animations
4. **Use `once` prop**: Prevent re-triggering animations on scroll
5. **Group related animations**: Use `StaggeredList` for related items

## Troubleshooting

### Animation not working?
- Ensure `MotionProvider` is wrapping your app (already done in layout.tsx)
- Check that you're not using conflicting CSS transitions
- Verify the component is in the viewport for `once={true}` animations

### Performance issues?
- Use `fps` prop in `useAnimationFrame` to limit frame rate
- Consider using `once={true}` to prevent repeated animations
- Avoid animating large lists; use virtualization if needed

## Examples

See `components/examples/AnimationExample.tsx` for a complete working example of all animation patterns.
