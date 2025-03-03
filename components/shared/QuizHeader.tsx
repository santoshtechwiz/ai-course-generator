// "use client"

// import { motion } from "framer-motion"
// import { Sparkles } from "lucide-react"
// import type React from "react" // Added import for React

// interface QuizHeaderProps {
//   topic?: string
// }

// const QuizHeader: React.FC<QuizHeaderProps> = ({ topic }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="text-center"
//     >
//       <motion.h1
//         className="text-4xl font-bold text-primary mb-2 flex items-center justify-center"
//         whileHover={{ scale: 1.05 }}
//       >
//         <Sparkles className="mr-2" />
//         {topic} Quiz
//       </motion.h1>
//       <p className="text-muted-foreground">Test your knowledge and learn something new!</p>
//     </motion.div>
//   )
// }

// export default QuizHeader

import type { ReactNode } from "react"

interface QuizHeaderProps {
  topic: string
  subtitle?: string
  icon?: ReactNode
}

export default function QuizHeader({ topic, subtitle, icon }: QuizHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
        {icon && <span className="mr-2">{icon}</span>}
        {topic}
      </h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

