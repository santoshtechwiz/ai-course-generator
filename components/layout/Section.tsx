export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="py-8 md:py-12 space-y-6">
      {title && <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
