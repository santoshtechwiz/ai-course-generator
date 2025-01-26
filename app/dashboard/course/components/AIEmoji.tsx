import type React from "react"
import { motion } from "framer-motion"

const AIEmoji: React.FC = () => {
  return (
    <motion.div
      className="text-6xl"
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 1,
      }}
    >
      🤖
    </motion.div>
  )
}

export default AIEmoji

