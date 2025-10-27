"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import neo from "@/components/neo/tokens";
import { X, CheckCircle, Sparkles, Target, Zap, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  icon?: React.ElementType;
  difficulty?: string;
  taglines?: string[];
  currentTagline?: number;
  showUpgradeBadge?: boolean;
  requiredPlan?: string;
  requiredPlanConfig?: { name: string };
  benefits?: string[];
  url?: string;
  colorClasses?: {
    icon?: string;
    button?: string;
  };
  children?: React.ReactNode;
  maxWidth?: string;
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  difficulty,
  taglines = [],
  currentTagline = 0,
  showUpgradeBadge = false,
  requiredPlan = "FREE",
  requiredPlanConfig,
  benefits = [],
  url,
  colorClasses = { icon: "text-blue-500", button: "bg-blue-500 text-white" },
  children,
  maxWidth = "max-w-5xl",
}: AppDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-[var(--color-card)] sm:max-h-[90vh] p-0 border border-border shadow-lg overflow-hidden flex flex-col",
          maxWidth
        )}
      >
        <div className="grid lg:grid-cols-2 flex-1 min-h-0">
          {/* Left Hero Section */}
          <div className="p-6 lg:p-8 bg-[var(--color-bg)] border-r border-border flex flex-col">
            <DialogHeader className="space-y-4 sm:space-y-6">
              <DialogTitle className="flex items-center justify-between">
                <div className={`flex items-center text-4xl font-bold ${colorClasses.icon}`}>
                  {Icon && (
                    <motion.div
                      initial={{ rotate: 0, scale: 0.8 }}
                      animate={{ rotate: 360, scale: 1 }}
                      transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
                    >
                      <Icon className="h-12 w-12 mr-4" />
                    </motion.div>
                  )}
                  <motion.span
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {title}
                  </motion.span>
                </div>

                <div className="flex items-center gap-3">
                  {showUpgradeBadge ? (
                    <div className={cn(neo.badge, "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 neo-shadow flex items-center px-2 py-1 rounded")}>
                      <Crown className="h-3 w-3 mr-1" />
                      {requiredPlanConfig?.name} Required
                    </div>
                  ) : requiredPlan !== "FREE" ? (
                    <div className={cn(neo.badge, "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 neo-shadow flex items-center px-2 py-1 rounded")}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unlocked
                    </div>
                  ) : null}
                  {difficulty && (
                    <div className={cn(neo.badge, "px-2 py-1 rounded", colorClasses.icon)}>
                      {difficulty}
                    </div>
                  )}
                </div>
              </DialogTitle>

              {description && (
                <DialogDescription asChild>
                  <div className="space-y-6">
                    {/* Rotating Taglines */}
                    <AnimatePresence mode="wait">
                      {taglines[currentTagline] && (
                        <motion.div
                          key={currentTagline}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 1.05 }}
                          transition={{ duration: 0.5, type: "spring" }}
                          className="text-center py-6 bg-[var(--color-card)]/60 dark:bg-[var(--color-muted)]/30 rounded-xl border backdrop-blur-sm"
                        >
                          <p className="text-lg font-medium italic px-6">
                            "{taglines[currentTagline]}"
                          </p>
                          <div className="flex justify-center mt-4 space-x-2">
                            {taglines.map((_, i) => (
                              <motion.div
                                key={i}
                                className={`h-2 w-2 rounded-full transition-colors ${
                                  i === currentTagline
                                    ? colorClasses.icon.replace("text-", "bg-")
                                    : "bg-gray-300"
                                }`}
                                animate={{ scale: i === currentTagline ? 1.2 : 1 }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-lg text-muted-foreground leading-relaxed text-center"
                    >
                      {description}
                    </motion.p>
                  </div>
                </DialogDescription>
              )}
            </DialogHeader>

            {Icon && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex justify-center mt-8"
              >
                <Icon className={`h-32 w-32 ${colorClasses.icon}`} />
              </motion.div>
            )}
          </div>

          {/* Right Details Section */}
          <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
            {children}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 p-6 border-t bg-muted/20 flex-shrink-0">
          {url && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button
                onClick={() => router.push(url)}
                className={cn("w-full h-12 font-bold text-base", colorClasses.button, "shadow-xl hover:shadow-2xl transition-all duration-300")}
              >
                Get Started
              </Button>
            </motion.div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AppDialog;
