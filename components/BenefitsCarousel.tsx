"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterval } from "@/hooks/useInterval";

const benefits = [
  {
    title: "Create Custom Courses",
    description: "Generate personalized courses on any topic of your choice with AI assistance.",
    icon: "🎯",
  },
  {
    title: "Smart Knowledge Checks",
    description: "Automatic generation of quizzes and assessments to test your understanding.",
    icon: "🧠",
  },
  {
    title: "Multiple Question Types",
    description: "Create diverse assessments with MCQs, openended questions, and more.",
    icon: "❓",
  },
  {
    title: "AI-Powered Learning",
    description: "Leverage AI to create comprehensive course content and learning materials.",
    icon: "🤖",
  },
  {
    title: "Track Your Progress",
    description: "Monitor your learning journey with detailed progress tracking and analytics.",
    icon: "📊",
  },
  {
    title: "Flexible Learning Path",
    description: "Choose your topics, set your pace, and learn exactly what you want to learn.",
    icon: "🛣️",
  },
];

export const BenefitsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  useInterval(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length);
  }, 5000);

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
              className="text-6xl mb-4"
            >
              {benefits[currentIndex].icon}
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">{benefits[currentIndex].title}</h2>
            <p className="text-lg opacity-90">{benefits[currentIndex].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
