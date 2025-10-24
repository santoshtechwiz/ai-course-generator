export const neo = {
  // Main card wrapper used across neo components (Tailwind theme-aligned)
  card: "border-4 border-[var(--color-border)] shadow-neo bg-[var(--color-card)] rounded-[var(--radius)]",
  cardSm: "border-2 border-[var(--color-border)] shadow-neo-sm bg-[var(--color-card)] rounded-[var(--radius-sm)]",
  cardLg: "border-4 border-[var(--color-border)] shadow-neo-lg bg-[var(--color-card)] rounded-[var(--radius-lg)]",
  
  // Card header: spacing + bottom border
  header: "pb-4 px-6 py-6 border-b-4 border-[var(--color-border)]",
  // Card content wrapper spacing
  content: "space-y-4 px-6 pb-6 pt-6",
  
  // Primary neo button
  buttonPrimary: "bg-[var(--color-primary)] text-white border-4 border-[var(--color-border)] shadow-neo font-black uppercase rounded-[var(--radius)]",
  buttonSecondary: "bg-[var(--color-accent)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-neo font-black uppercase rounded-[var(--radius)]",
  
  // Inner elements should avoid stacking heavy borders; use a lighter border here
  inner: "border border-[var(--color-border)]",
  
  // Standardized badge token for status/number badges
  badge: "inline-flex items-center justify-center h-9 text-sm px-3 font-black rounded-[var(--radius-sm)] border-4 border-[var(--color-border)] bg-[var(--color-accent)] text-[var(--color-text)]",
  badgePrimary: "inline-flex items-center justify-center h-9 text-sm px-3 font-black rounded-[var(--radius-sm)] border-4 border-[var(--color-border)] bg-[var(--color-primary)] text-white",
  
  // Input styling
  input: "bg-[var(--color-card)] border-4 border-[var(--color-border)] px-3 py-2 rounded-[var(--radius-sm)] focus:ring-4 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] shadow-neo-sm",
  
  // Sticky header utilities
  stickyHeader: "sticky top-0 z-sticky bg-[var(--color-bg)] border-b-4 border-[var(--color-border)] shadow-neo-sm",
  stickyHeaderElevated: "sticky top-0 z-fixed bg-[var(--color-bg)] border-b-4 border-[var(--color-border)] shadow-neo",
}

export default neo
