export const neo = {
  // Main card wrapper used across neo components (Neo-Brutalism aligned)
  card: "border-6 border-border shadow-neo bg-card neo-hover-lift rounded-none",
  // Card header: spacing + bottom border
  header: "pb-4 px-6 py-6 border-b-4 border-border font-black uppercase tracking-wider",
  // Card content wrapper spacing
  content: "space-y-4 px-6 pb-6 pt-6 font-bold",
  // Primary neo button
  buttonPrimary: "bg-accent text-background border-4 border-border shadow-neo font-black uppercase tracking-wider neo-hover-lift neo-press min-h-[44px]",
  // Inner elements should avoid stacking heavy borders; use a lighter border here
  inner: "border-3 border-border",
  // Standardized badge token for status/number badges
  // Use a consistent height, padding and font size so badges across the app align visually.
  badge: "inline-flex items-center justify-center h-9 text-sm px-3 font-black rounded-none border-3 border-border bg-accent text-background shadow-neo uppercase tracking-wider",
}

export default neo
