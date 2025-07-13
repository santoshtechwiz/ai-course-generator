import type { LucideIcon } from "lucide-react";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon; // Lucide icon component
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3">
        {Icon && <Icon className="h-10 w-10 text-purple-600 dark:text-purple-400" />}
        <span className="ai-gradient-text">{title}</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
        {description}
      </p>
      {children}
    </div>
  );
}

