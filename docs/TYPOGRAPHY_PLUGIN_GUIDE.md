# Tailwind Typography Plugin - Usage Guide

## Overview
The `@tailwindcss/typography` plugin has been added to provide beautiful, pre-configured typographic defaults for markdown content.

## Installation
```bash
npm install -D @tailwindcss/typography
```

✅ **Already installed and configured!**

## Basic Usage

### Simple Markdown Content
```tsx
<article className="prose dark:prose-invert">
  <h1>Article Title</h1>
  <p>Your markdown content here...</p>
</article>
```

### With Custom Sizing
```tsx
// Small
<div className="prose prose-sm dark:prose-invert">
  {markdownContent}
</div>

// Base (default)
<div className="prose dark:prose-invert">
  {markdownContent}
</div>

// Large
<div className="prose prose-lg dark:prose-invert">
  {markdownContent}
</div>

// Extra Large
<div className="prose prose-xl dark:prose-invert">
  {markdownContent}
</div>

// 2X Large
<div className="prose prose-2xl dark:prose-invert">
  {markdownContent}
</div>
```

### Full Width Content
By default, prose has a max-width. To make it full width:
```tsx
<div className="prose max-w-none dark:prose-invert">
  {content}
</div>
```

## Customization

### Theme Configuration
The typography plugin has been customized in `tailwind.config.ts` to match your design system:

- **Colors**: Uses your theme colors (foreground, muted, primary, border)
- **Code blocks**: Custom styling with proper background and padding
- **Links**: Styled to match your primary color with hover effects
- **Dark mode**: Fully compatible with your dark mode theme

### Custom Styles Applied

1. **Code Styling**:
   - Background: `muted.DEFAULT`
   - Padding: `0.25rem 0.375rem`
   - Border radius: `sm`
   - No backticks before/after inline code

2. **Pre/Code Blocks**:
   - Background: `muted.DEFAULT`
   - Border radius: `lg`

3. **Links**:
   - No underline by default
   - Font weight: 500
   - Underline on hover
   - Color: `primary.DEFAULT`

## Component Example

### Markdown Renderer Component
```tsx
import ReactMarkdown from 'react-markdown'

export function MarkdownContent({ content }: { content: string }) {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  )
}
```

### Course Summary with Typography
```tsx
export function CourseSummary({ summary }: { summary: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
      <ReactMarkdown 
        components={{
          // Custom component overrides if needed
          code({ node, inline, className, children, ...props }) {
            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <pre className={className}>
                <code {...props}>{children}</code>
              </pre>
            )
          }
        }}
      >
        {summary}
      </ReactMarkdown>
    </div>
  )
}
```

## Color Schemes

The plugin supports different color schemes:
```tsx
// Slate (default)
<div className="prose prose-slate dark:prose-invert">

// Gray
<div className="prose prose-gray dark:prose-invert">

// Zinc
<div className="prose prose-zinc dark:prose-invert">

// Neutral
<div className="prose prose-neutral dark:prose-invert">

// Stone
<div className="prose prose-stone dark:prose-invert">
```

## Best Practices

1. **Always include dark mode**: Use `dark:prose-invert` for dark mode support
2. **Remove max-width for full layouts**: Add `max-w-none` when needed
3. **Match color scheme**: Use `prose-slate` or similar to match your design
4. **Size appropriately**: Use `prose-sm` for compact areas, `prose-lg` for main content

## Common Use Cases

### Blog Post
```tsx
<article className="prose prose-lg dark:prose-invert mx-auto">
  <ReactMarkdown>{blogContent}</ReactMarkdown>
</article>
```

### Course Chapter Content
```tsx
<div className="prose prose-slate dark:prose-invert max-w-none">
  <ReactMarkdown>{chapterSummary}</ReactMarkdown>
</div>
```

### Quiz Explanation
```tsx
<div className="prose prose-sm dark:prose-invert">
  <ReactMarkdown>{explanation}</ReactMarkdown>
</div>
```

### AI Chat Messages
```tsx
<div className="prose prose-sm dark:prose-invert max-w-none">
  <ReactMarkdown>{aiResponse}</ReactMarkdown>
</div>
```

## Tailwind Classes Reference

| Class | Description |
|-------|-------------|
| `prose` | Base typography styles |
| `prose-sm` | Small size (14px base) |
| `prose-base` | Default size (16px base) |
| `prose-lg` | Large size (18px base) |
| `prose-xl` | Extra large size (20px base) |
| `prose-2xl` | 2X large size (24px base) |
| `dark:prose-invert` | Dark mode styles |
| `max-w-none` | Remove max-width constraint |
| `prose-slate` | Slate color scheme |
| `prose-gray` | Gray color scheme |
| `prose-zinc` | Zinc color scheme |

## Testing

Test the typography plugin with various markdown elements:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

- Bullet list item 1
- Bullet list item 2

1. Numbered list item 1
2. Numbered list item 2

[Link text](https://example.com)

`inline code`

\`\`\`javascript
// Code block
const example = "hello world";
\`\`\`

> Blockquote text

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

---

**Status**: ✅ Installed and Configured  
**Version**: Latest compatible with Tailwind CSS 3.4+  
**Documentation**: https://tailwindcss.com/docs/typography-plugin
