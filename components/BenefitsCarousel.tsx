"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterval } from "@/hooks/useInterval";

const benefits = [
  {
    title: "Video Transcript to Course",
    description: "Transform any video transcript into a comprehensive course with ease.",
    icon: "🎥",
  },
  {
    title: "Custom Quiz Creation",
    description: "Design personalized quizzes to reinforce learning from video content.",
    icon: "📝",
  },
  {
    title: "Multiple Question Types",
    description: "Create diverse assessments with MCQs, open-ended questions, and fill-in-the-blanks.",
    icon: "❓",
  },
  {
    title: "Progress Tracking",
    description: "Monitor learner engagement and performance with detailed progress analytics.",
    icon: "📊",
  },
  {
    title: "AI-Powered Content Generation",
    description: "Leverage AI to automatically generate course content and quizzes from transcripts.",
    icon: "🤖",
  },
  {
    title: "Flexible Learning Paths",
    description: "Customize learning experiences based on individual user progress and preferences.",
    icon: "🛤️",
  },
]


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
