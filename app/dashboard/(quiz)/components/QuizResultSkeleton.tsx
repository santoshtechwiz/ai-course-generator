"use client";

import React from "react";
import { motion } from "framer-motion";

export function QuizResultSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <motion.div 
            className="h-10 w-48 bg-muted rounded-md"
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div 
            className="h-10 w-24 bg-muted rounded-md"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        
        {/* Score circle skeleton */}
        <div className="flex justify-center py-6">
          <motion.div 
            className="h-40 w-40 rounded-full bg-muted"
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <div className="h-full w-full flex items-center justify-center">
              <motion.div 
                className="h-32 w-32 rounded-full bg-background"
                animate={{ opacity: [0.7, 0.9, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <motion.div 
              key={i}
              className="h-20 bg-muted rounded-lg"
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
      
      {/* Questions skeleton */}
      <div className="space-y-6 mt-12">
        <motion.div
          className="h-8 w-48 bg-muted rounded-md"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {[1, 2, 3].map(i => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <motion.div 
              className="h-6 bg-muted rounded-md w-full max-w-lg"
              animate={{ opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 1.8, delay: i * 0.1, repeat: Infinity }}
            />
            
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map(j => (
                <motion.div 
                  key={j}
                  className="h-12 bg-muted rounded-md"
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, delay: (i + j) * 0.05, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
