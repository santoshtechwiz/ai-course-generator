// components/AnimatedIntro.tsx
"use client";
import { motion } from "framer-motion";

export function AnimatedIntro() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h1 className="text-4xl font-bold mb-2 text-center text-primary text-gray-900 dark:text-gray-100">
        Explore Quizzes
      </h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
          Discover interactive quizzes to test and enhance your programming knowledge and skills. Create your own
          quizzes to share with the community.
        </p>
      </motion.div>
    </motion.div>
  );
}
