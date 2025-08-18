import type { LucideIcon } from "lucide-react";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-5 lg:py-6">
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
    <div className="text-center mb-6 sm:mb-8 md:mb-10">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 sm:mb-3 flex items-center justify-center gap-2 sm:gap-3 text-balance">
        {Icon && <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />}
        <span className="ai-gradient-text leading-tight">{title}</span>
      </h1>
      <p className="text-base sm:text-lg text-muted-foreground max-w-prose mx-auto leading-relaxed px-0">
        {description}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

