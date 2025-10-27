import type { LucideIcon } from "lucide-react";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  // Render a full-width wrapper by default (no horizontal padding) to match the new global layout
  return (
    <div className="w-full max-w-full px-0 py-6 sm:py-8">
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
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2 sm:gap-3 text-balance">
          {Icon && (
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          )}
          <span className="text-primary leading-tight">
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

