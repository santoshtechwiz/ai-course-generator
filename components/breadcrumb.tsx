import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode;
  children: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator, children, ...props }, ref) => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) {
      return (
        <nav
          ref={ref}
          aria-label="breadcrumb"
          className={cn("flex items-center", className)}
          {...props}
        />
      );
    }

    const validChildren = React.Children.toArray(children).filter(
      (child, index, array) => 
        React.isValidElement(child) && 
        array.findIndex(c => 
          React.isValidElement(c) && 
          c.props.children === child.props.children
        ) === index
    );

    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={cn("flex items-center", className)}
        {...props}
      >
        <BreadcrumbList separator={separator}>
          {validChildren}
        </BreadcrumbList>
      </nav>
    );
  }
);
Breadcrumb.displayName = "Breadcrumb";

interface BreadcrumbListProps extends React.ComponentPropsWithoutRef<"ol"> {
  separator?: React.ReactNode;
}

const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, separator, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const count = childrenArray.length;

    return (
      <ol
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
          className
        )}
        {...props}
      >
        {childrenArray.map((child, index) => {
          if (!React.isValidElement(child)) return null;

          const linkChild = React.Children.toArray(child.props.children).find(
            (c) => React.isValidElement(c) && c.type === BreadcrumbLink
          );

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center"
            >
              {linkChild && React.isValidElement(linkChild) ? (
                <>
                  <BreadcrumbItem>
                    {React.cloneElement(linkChild, {
                      isActive: index === count - 1,
                      level: index,
                    })}
                  </BreadcrumbItem>
                  {index < count - 1 && (
                    <BreadcrumbSeparator>
                      {separator}
                    </BreadcrumbSeparator>
                  )}
                </>
              ) : (
                <>
                  <BreadcrumbItem>
                    {child}
                  </BreadcrumbItem>
                  {index < count - 1 && (
                    <BreadcrumbSeparator>
                      {separator}
                    </BreadcrumbSeparator>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </ol>
    );
  }
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  asChild?: boolean;
  isActive?: boolean;
  level?: number;
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, isActive = false, level = 0, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";

    // Color progression based on level
    const levelColors = [
      "text-blue-600 hover:text-blue-800", // Level 0
      "text-purple-600 hover:text-purple-800", // Level 1
      "text-green-600 hover:text-green-800", // Level 2
      "text-yellow-600 hover:text-yellow-800", // Level 3
      "text-red-600 hover:text-red-800", // Level 4
    ];

    const bgColors = [
      "hover:bg-blue-50", // Level 0
      "hover:bg-purple-50", // Level 1
      "hover:bg-green-50", // Level 2
      "hover:bg-yellow-50", // Level 3
      "hover:bg-red-50", // Level 4
    ];

    const colorClass = levelColors[Math.min(level, levelColors.length - 1)];
    const bgClass = bgColors[Math.min(level, bgColors.length - 1)];

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Comp
          ref={ref}
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isActive 
              ? "font-medium text-foreground pointer-events-none bg-accent" 
              : cn(colorClass, bgClass, "text-muted-foreground"),
            className
          )}
          aria-current={isActive ? "page" : undefined}
          {...props}
        />
      </motion.div>
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbSeparator = ({ 
  children, 
  className, 
  ...props 
}: React.ComponentProps<"li">) => (
  <motion.li
    role="presentation"
    aria-hidden="true"
    className={cn(
      "flex items-center text-muted-foreground [&>svg]:size-3.5",
      className
    )}
    initial={{ opacity: 0, x: -5 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
    {...props}
  >
    {children || (
      <motion.div 
        whileHover={{ scale: 1.2 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
      </motion.div>
    )}
  </motion.li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ 
  className, 
  ...props 
}: React.ComponentProps<"span">) => (
  <motion.span
    role="presentation"
    aria-hidden="true"
    className={cn(
      "flex h-6 w-6 items-center justify-center rounded-md",
      "bg-muted text-muted-foreground",
      className
    )}
    whileHover={{ scale: 1.1 }} // Correctly typed hover animation
    {...props}
  >
    &#8230;
    <span className="sr-only">More items</span>
  </motion.span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};