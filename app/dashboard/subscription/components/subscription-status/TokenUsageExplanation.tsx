"use client"

import { Check, Zap } from "lucide-react"
import { motion } from "framer-motion"

// Redesigned TokenUsageExplanation component with animations
export default function TokenUsageExplanation() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className="mt-12 p-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <motion.div className="md:w-1/4 flex justify-center" variants={itemVariants}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Zap className="h-12 w-12 text-white" />
          </div>
        </motion.div>
        <div className="md:w-3/4 text-left">
          <motion.h3
            className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
            variants={itemVariants}
          >
            Understanding Token Usage
          </motion.h3>
          <motion.p className="text-muted-foreground mb-4" variants={itemVariants}>
            Tokens are used to generate quizzes and access various features on our platform. Each quiz you generate
            consumes a certain number of tokens based on the complexity and type of questions.
          </motion.p>
          <motion.ul className="space-y-2 mb-4" variants={containerVariants}>
            <motion.li className="flex items-start" variants={itemVariants}>
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Generating multiple-choice quizzes consumes fewer tokens</span>
            </motion.li>
            <motion.li className="flex items-start" variants={itemVariants}>
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Creating open-ended or code-based quizzes may require more tokens</span>
            </motion.li>
            <motion.li className="flex items-start" variants={itemVariants}>
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Downloading quizzes in PDF format also consumes tokens</span>
            </motion.li>
          </motion.ul>
          <motion.p className="text-muted-foreground" variants={itemVariants}>
            You can purchase additional tokens at any time to continue using our services.
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}
