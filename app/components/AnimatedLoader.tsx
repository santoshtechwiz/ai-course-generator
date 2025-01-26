"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLoaderContext } from "../providers/LoadingContext"



const loaderVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
}

const circleVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse" as const,
      duration: 0.5,
    },
  },
}

export const AnimatedLoader = () => {
  const { isLoading } = useLoaderContext()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={loaderVariants}
          aria-live="polite"
          aria-busy={isLoading}
        >
          <div className="flex space-x-2" role="status">
            {[...Array(3)].map((_, i) => (
              <motion.div key={i} className="w-4 h-4 bg-white rounded-full" variants={circleVariants} />
            ))}
            <span className="sr-only">Loading...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

