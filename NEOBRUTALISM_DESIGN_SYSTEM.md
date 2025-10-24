# 🎨 Neobrutalism Design System Guide

## Overview
This document outlines the unified Neobrutalism design system implemented across the entire application. Use this guide to maintain consistency when creating new components or updating existing ones.

## 🎯 Core Principles

### 1. **Thick Borders**
- Use `border-4` for primary elements
- Use `border-2` for secondary/inner elements
- Always use `border-[var(--color-border)]` or `border-border`

### 2. **Flat Colors**
- No gradients, glass effects, or blur
- Use solid colors from the CSS variable system
- Bright accent colors: Primary pink `#ff007f`, Accent cyan `#00f5d4`

### 3. **Chunky Shadows**
- Primary: `shadow-neo` (4px 4px 0)
- Large: `shadow-neo-lg` (6px 6px 0)
- Extra large: `shadow-neo-xl` (8px 8px 0)
- Small: `shadow-neo-sm` (2px 2px 0)

### 4. **Rounded Corners**
- Small: `rounded-md` (var(--radius))
- Large: `rounded-lg` (var(--radius-lg))
- Extra large: `rounded-xl` (var(--radius-xl))

## 🎨 CSS Classes Reference

### Cards
```css
.neo-card          /* Standard card with padding, border, shadow */
.neo-card-lg       /* Large card with more padding */
.neo-card-xl       /* Extra large card */
```

### Buttons
```css
.neo-button           /* Primary button */
.neo-button-secondary /* Secondary button */
.neo-button-accent    /* Accent button */
.neo-button-sm        /* Small button */
.neo-button-lg        /* Large button */
```

### Badges
```css
.neo-badge         /* Standard badge */
.neo-badge-primary /* Primary colored badge */
.neo-badge-success /* Success colored badge */
.neo-badge-warning /* Warning colored badge */
.neo-badge-error   /* Error colored badge */
```

### Layout
```css
.neo-container     /* Responsive container with proper padding */
.neo-sticky-header /* Consistent sticky header */
.neo-grid          /* Responsive grid with proper gaps */
.neo-grid-2        /* 2-column responsive grid */
.neo-grid-3        /* 3-column responsive grid */
.neo-grid-4        /* 4-column responsive grid */
```

### Interactive States
```css
.neo-interactive   /* Full interactive behavior (hover, active, focus) */
.neo-hover-lift    /* Simple hover lift effect */
```

### Responsive Spacing
```css
.neo-space-y       /* Responsive vertical spacing */
.neo-space-x       /* Responsive horizontal spacing */
.neo-gap           /* Responsive gap */
.neo-p             /* Responsive padding */
.neo-px            /* Responsive horizontal padding */
.neo-py            /* Responsive vertical padding */
```

## 🎬 Animation Classes

### Loading Animations
```css
.neo-pulse         /* Pulsing effect */
.neo-bounce        /* Bouncing effect */
.neo-spinner       /* Spinning loader */
.neo-loading-dots  /* Animated dots */
```

### Entrance Animations
```css
.neo-slide-up      /* Slide up from bottom */
.neo-slide-in      /* Slide in from left */
.neo-fade-in       /* Fade in */
.neo-scale-in      /* Scale in from center */
```

### Interactive Animations
```css
.neo-shake         /* Shake effect (for errors) */
.neo-wiggle        /* Subtle wiggle */
```

### Staggered Animations
```css
.neo-stagger       /* Apply to parent for staggered child animations */
```

## 🎨 Color System

### CSS Variables
```css
--color-bg         /* Background color */
--color-text       /* Text color */
--color-primary    /* Primary brand color */
--color-accent     /* Accent color */
--color-card       /* Card background */
--color-muted      /* Muted background */
--color-border     /* Border color */
--color-success    /* Success color */
--color-warning    /* Warning color */
--color-error      /* Error color */
```

### Tailwind Classes
```css
background         /* var(--color-bg) */
foreground         /* var(--color-text) */
primary            /* var(--color-primary) */
accent             /* var(--color-accent) */
card               /* var(--color-card) */
muted              /* var(--color-muted) */
border             /* var(--color-border) */
success            /* var(--color-success) */
warning            /* var(--color-warning) */
error              /* var(--color-error) */
```

## 🏗️ Component Usage Examples

### Basic Card
```tsx
<div className="neo-card">
  <h2 className="font-black text-foreground">Card Title</h2>
  <p className="text-foreground/70">Card content goes here.</p>
</div>
```

### Interactive Button
```tsx
<button className="neo-button">
  Click me
</button>
```

### Badge with Status
```tsx
<span className="neo-badge-success">
  Completed
</span>
```

### Responsive Grid
```tsx
<div className="neo-grid-3">
  <div className="neo-card">Item 1</div>
  <div className="neo-card">Item 2</div>
  <div className="neo-card">Item 3</div>
</div>
```

### Loading State
```tsx
<div className="neo-card">
  <NeoLoader 
    message="Loading content..." 
    size="md" 
    variant="spinner"
  />
</div>
```

## 📱 Responsive Design

### Breakpoints
- `xs`: 480px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Optimizations
- Cards use smaller padding on mobile (`p-4` instead of `p-6`)
- Buttons have minimum touch target of 44px
- Container uses reduced padding (`px-3` instead of `px-4`)

### Touch Device Handling
- Hover effects are disabled on touch devices
- Interactive animations are optimized for touch

## ♿ Accessibility

### Focus States
- All interactive elements have visible focus outlines
- Focus outline uses primary color with 4px width and 2px offset

### Reduced Motion
- Respects `prefers-reduced-motion: reduce`
- Animations are disabled or simplified for users who prefer reduced motion

### Color Contrast
- All color combinations meet WCAG AA standards
- Text shadows are used sparingly and don't interfere with readability

## 🔧 Development Guidelines

### DO's
✅ Use CSS variables for colors  
✅ Use the neo-* classes for consistency  
✅ Test on all breakpoints  
✅ Ensure proper touch targets (44px minimum)  
✅ Add proper ARIA labels and roles  
✅ Use semantic HTML elements  

### DON'Ts
❌ Hardcode hex color values  
❌ Use gradients or glass effects  
❌ Create custom shadows (use the shadow system)  
❌ Ignore responsive design  
❌ Forget about accessibility  
❌ Mix different design systems  

## 🧪 Testing Checklist

Before deploying components:

- [ ] Works on mobile (320px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1280px width)
- [ ] Proper focus states
- [ ] Reduced motion respected
- [ ] Touch targets are 44px minimum
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader friendly
- [ ] Keyboard navigation works

## 🔄 Migration Guide

When updating existing components:

1. Replace hardcoded colors with CSS variables
2. Update shadows to use the neo shadow system
3. Replace custom borders with neo border classes
4. Add proper responsive classes
5. Ensure accessibility compliance
6. Test across all breakpoints

## 📦 Component Library

### Core Components
- `NeoLoader` - Unified loading component
- `Button` - Enhanced button with variants
- `Card` - Flexible card component
- `Badge` - Status and label badges
- `Input` - Form input with neo styling

### Layout Components
- `MainNavbar` - Application header
- `DashboardLayout` - Main layout wrapper
- `QuizPlayLayout` - Quiz-specific layout

## 🎯 Performance

### Optimizations Applied
- CSS variables reduce bundle size
- Animations use transform and opacity for GPU acceleration
- Reduced motion support prevents unnecessary animations
- Touch device optimizations reduce hover effects

### Best Practices
- Use CSS classes instead of inline styles
- Leverage the existing animation system
- Minimize custom CSS in favor of utility classes
- Use the neo-* classes for consistency

---

**Last Updated**: October 2024  
**Version**: 2.0  
**Maintainer**: Development Team