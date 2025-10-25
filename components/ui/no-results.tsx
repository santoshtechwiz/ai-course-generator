"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  SearchX,
  FileX,
  RefreshCw,
  AlertCircle,
  FileQuestion,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NoResultsVariant =
  | "search"
  | "quiz"
  | "data"
  | "error"
  | "empty"
  | "generic";

interface NoResultsProps {
  title?: string;
  description?: string;
  variant?: NoResultsVariant;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
    icon?: React.ReactNode;
  };
  className?: string;
  iconClassName?: string;
  illustrationPlacement?: "top" | "left";
  customIcon?: React.ReactNode;
  minimal?: boolean;
}

export function NoResults({
  title,
  description,
  variant = "generic",
  action,
  secondaryAction,
  className,
  iconClassName,
  illustrationPlacement = "top",
  customIcon,
  minimal = false
}: NoResultsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isLeftPlacement = illustrationPlacement === "left";

  // Get predefined content based on variant
  const content = getContentByVariant(variant, {
    title,
    description,
    action
  });
  
  const IconEl = customIcon ? (
    <>{customIcon}</>
  ) : (
    <content.icon className={cn(
      isLeftPlacement ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-10 sm:w-10"
    )} />
  );

  return (
    <motion.div 
      className={cn(
        "rounded-md overflow-hidden border-4 border-black",
        isLeftPlacement ? 
          "sm:flex items-center sm:gap-6 gap-4 flex-col sm:flex-row" : 
          "text-center",
        !minimal && "bg-[var(--color-card)] shadow-[4px_4px_0_#000] p-4 sm:p-8",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Icon/Illustration Section */}
      <div 
        className={cn(
          isLeftPlacement ? "sm:flex-shrink-0" : "mx-auto mb-4 sm:mb-6", 
          iconClassName
        )}
      >
        <motion.div
          className={cn(
            "rounded-md flex items-center justify-center border-4 border-black",
            minimal ? "text-[var(--color-text)]/70" : "bg-[var(--color-bg)] text-[var(--color-text)]",
            isLeftPlacement ? 
              "sm:h-16 sm:w-16 h-14 w-14" : 
              "h-16 w-16 sm:h-20 sm:w-20 mx-auto"
          )}
          animate={{ 
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
            scale: isHovered ? 1.05 : 1 
          }}
          transition={{ duration: 0.5 }}
        >
          {IconEl}
        </motion.div>
      </div>

      {/* Content Section */}
      <div className={isLeftPlacement ? "flex-1 text-center sm:text-left" : ""}>
        <h3 className={cn(
          "font-semibold",
          isLeftPlacement ? "text-base sm:text-lg mb-2" : "text-lg sm:text-xl mb-2 sm:mb-3"
        )}>
          {content.title}
        </h3>
        
        <p className="text-[var(--color-text)]/70 mb-4 sm:mb-6 text-sm sm:text-base">
          {content.description}
        </p>
        
        {/* Actions */}
        {(action || secondaryAction || content.action) && (
          <div className={cn(
            "flex flex-wrap gap-3",
            isLeftPlacement ? "justify-center sm:justify-start" : "justify-center"
          )}>
            {action && (
              <Button 
                onClick={action.onClick} 
                variant={action.variant || "default"}
                className="gap-2"
              >
                {action.icon || content.actionIcon}
                {action.label}
              </Button>
            )}
            
            {!action && content.action && (
              <Button 
                onClick={content.action.onClick} 
                variant={content.action.variant || "default"}
                className="gap-2"
              >
                {content.actionIcon}
                {content.action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button 
                onClick={secondaryAction.onClick} 
                variant={secondaryAction.variant || "outline"}
                className="gap-2"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Content Config Generator ---
interface ContentConfig {
  title?: string;
  description?: string;
  action?: NoResultsProps["action"];
}

function getContentByVariant(variant: NoResultsVariant, config: ContentConfig) {
  switch (variant) {
    case "search":
      return {
        icon: SearchX,
        title: config.title || "No Results Found",
        description:
          config.description ||
          "We couldn't find any matches. Try using different keywords or filters.",
        action: config.action,
        actionIcon: <RefreshCw className="h-4 w-4" />,
      };
    case "quiz":
      return {
        icon: FileQuestion,
        title: config.title || "No Quiz Results",
        description:
          config.description || "Retake the quiz to view your results.",
        action: config.action,
        actionIcon: <RefreshCw className="h-4 w-4" />,
      };
    case "data":
      return {
        icon: FileX,
        title: config.title || "No Data Available",
        description:
          config.description || "There is currently no data to display.",
        action: config.action,
        actionIcon: <RefreshCw className="h-4 w-4" />,
      };
    case "error":
      return {
        icon: AlertCircle,
        title: config.title || "Something Went Wrong",
        description:
          config.description || "We encountered an error. Please try again.",
        action: config.action,
        actionIcon: <RefreshCw className="h-4 w-4" />,
      };
    case "empty":
      return {
        icon: FileX,
        title: config.title || "It's Empty Here",
        description:
          config.description ||
          "There's nothing to show just yet. Try adding some content.",
        action: config.action,
        actionIcon: <RefreshCw className="h-4 w-4" />,
      };
    case "generic":
    default:
      return {
        icon: ThumbsDown,
        title: config.title || "Nothing Found",
        description:
          config.description || "We couldn’t find what you were looking for.",
        action: config.action,
        actionIcon: <RefreshCw className="h-4 w-4" />,
      };
  }
}
