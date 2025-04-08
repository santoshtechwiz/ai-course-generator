"use client"

import { motion } from "framer-motion"

const MissionIcon = ({ className = "w-6 h-6" }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="M12 2L4.5 10 8 12l-3.5 8L12 14l-3.5-2L12 2z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M12 2l7.5 8-3.5 2 3.5 8-7.5-6 3.5-2L12 2z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
      />
    </svg>
  )
}

export default MissionIcon
