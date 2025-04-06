import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode;
  children: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator, children, ...props }, ref) => {
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

          // Find the BreadcrumbLink component in the child's children
          const linkChild = React.Children.toArray(child.props.children).find(
            (c) => React.isValidElement(c) && c.type === BreadcrumbLink
          );

          if (linkChild && React.isValidElement(linkChild)) {
            return (
              <BreadcrumbItem key={index}>
                {React.cloneElement(linkChild, {
                  isActive: index === count - 1,
                })}
                {index < count - 1 && (
                  <BreadcrumbSeparator>
                    {separator}
                  </BreadcrumbSeparator>
                )}
              </BreadcrumbItem>
            );
          }

          return (
            <BreadcrumbItem key={index}>
              {child}
              {index < count - 1 && (
                <BreadcrumbSeparator>
                  {separator}
                </BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
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
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, isActive = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md transition-colors",
          "hover:text-foreground hover:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive 
            ? "font-medium text-foreground pointer-events-none" 
            : "text-muted-foreground",
          className
        )}
        aria-current={isActive ? "page" : undefined}
        {...props}
      />
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbSeparator = ({ 
  children, 
  className, 
  ...props 
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn(
      "flex items-center text-muted-foreground [&>svg]:size-3.5",
      className
    )}
    {...props}
  >
    {children || <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ 
  className, 
  ...props 
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn(
      "flex h-6 w-6 items-center justify-center rounded-md",
      "bg-muted text-muted-foreground",
      className
    )}
    {...props}
  >
    &#8230;
    <span className="sr-only">More items</span>
  </span>
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