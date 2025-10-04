import type { LucideIcon } from "lucide-react";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-5 lg:py-6">
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon; // Lucide icon component
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hero' | 'compact';
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
  variant = 'default'
}: PageHeaderProps) {
  const variantStyles = {
    default: "text-center mb-6 sm:mb-8 md:mb-10",
    hero: "text-center mb-8 sm:mb-12 md:mb-16 py-8 sm:py-12 md:py-16",
    compact: "text-center mb-4 sm:mb-6"
  };

  return (
    <header className={`${variantStyles[variant]} ${className || ''}`}>
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-2 sm:gap-3 text-balance">
          {Icon && (
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          )}
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
            {title}
          </span>
        </h1>

        {description && (
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            {description}
          </p>
        )}

        {children && (
          <div className="mt-6 sm:mt-8 md:mt-10">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

