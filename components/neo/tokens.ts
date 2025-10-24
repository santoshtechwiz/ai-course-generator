export const neo = {
  // Main card wrapper used across neo components (Tailwind theme-aligned)
  card: "border-4 border-border shadow-neo bg-card",
  // Card header: spacing + bottom border
  header: "pb-4 px-6 py-6 border-b-4 border-border",
  // Card content wrapper spacing
  content: "space-y-4 px-6 pb-6 pt-6",
  // Primary neo button
  buttonPrimary: "bg-accent text-background border-4 border-border shadow-neo font-black uppercase",
  // Inner elements should avoid stacking heavy borders; use a lighter border here
  inner: "border border-border",
  // Standardized badge token for small status/number badges
  badge: "inline-flex items-center justify-center text-xs px-2 py-1 font-black border-4 border-border bg-accent text-background",
}

export default neo
