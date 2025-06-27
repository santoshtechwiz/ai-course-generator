"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingUIProps {
  error?: string;
}

const LoadingUI: React.FC<LoadingUIProps> = ({ error }) => {
  return (
    <div className="flex flex-col w-full h-full aspect-video bg-muted animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50 mx-auto" />
          </motion.div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{error || "Loading your lesson..."}</p>
            <div className="w-48 h-1 mx-auto bg-muted-foreground/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: "linear",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingUI;
