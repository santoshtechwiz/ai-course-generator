'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { Bot, BookOpen, FileText, Sparkles, BrainCircuit, ListChecks, Rocket, Zap, Brain, Code, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Bot,
    secondaryIcons: [Rocket, Brain, Star],
    title: "Your AI Learning Partner",
    description: "Experience personalized learning with our advanced AI that adapts to your unique needs.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookOpen,
    secondaryIcons: [Code, Target, Zap],
    title: "Smart Course Generation",
    description: "Transform any topic into a structured learning experience in seconds.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: FileText,
    secondaryIcons: [Brain, Star, Rocket],
    title: "Instant Transcripts",
    description: "Generate accurate transcripts in seconds for any course.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: BrainCircuit,
    secondaryIcons: [Zap, Code, Target],
    title: "Auto Quiz Generation",
    description: "AI automatically creates relevant quizzes to test your understanding.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: ListChecks,
    secondaryIcons: [Target, Brain, Code],
    title: "Custom Quiz Creation",
    description: "Design your own quizzes or let AI enhance your existing questions.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Sparkles,
    secondaryIcons: [Star, Rocket, Zap],
    title: "Interactive Learning",
    description: "Engage with dynamic content that makes learning more effective.",
    gradient: "from-rose-500 to-orange-500",
  },
];

const FeatureShowcase: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const { progress } = useAutoPlay(features.length, (index) => setCurrentFeature(index));

  return (
    <div className="w-full max-w-[1400px] min-h-screen mx-auto">
      {/* Feature Showcase */}
      <div className="relative bg-white min-h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col items-center justify-center p-10 text-center z-10"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative mb-16"
            >
              {React.createElement(features[currentFeature].icon, {
                className: cn(
                  "w-56 h-56 relative",
                  `bg-gradient-to-r ${features[currentFeature].gradient} bg-clip-text text-transparent`
                ),
              })}
            </motion.div>
            <h2 className="text-[64px] font-bold mb-8 text-gray-900 tracking-tight">
              {features[currentFeature].title}
            </h2>
            <p className="text-3xl text-gray-500 max-w-4xl leading-relaxed">
              {features[currentFeature].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Moving Icon Bar */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-full h-40 -translate-y-1/2 overflow-hidden">
            <motion.div
              className="flex items-center gap-16 absolute"
              animate={{
                x: ['-25%', '-50%'],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
                  ease: 'linear',
                },
              }}
            >
              {[...features, ...features].map((feature, index) => (
                <React.Fragment key={index}>
                  {feature.secondaryIcons.map((Icon, iconIndex) => (
                    <Icon
                      key={`${index}-${iconIndex}`}
                      className={cn(
                        "w-20 h-20 opacity-5",
                        `text-gradient-to-r ${feature.gradient}`
                      )}
                    />
                  ))}
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", `bg-gradient-to-r ${features[currentFeature].gradient}`)}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;

