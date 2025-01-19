'use client'

import { motion } from 'framer-motion';
import { QuizIcon } from './QuizIcon';
import { Badge } from './Badge';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Quiz, QuizCardProps } from "@/app/types";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const cardVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  hover: { scale: 1.05, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
};

export const QuizCardV2 = ({ title, description, difficulty, questionCount, isTrending,slug,quizType}: QuizCardProps) => {
  const isDarkMode = useColorScheme();

  return (
    <motion.div
      className={`w-full max-w-sm rounded-lg overflow-hidden ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      } shadow-lg transition-all duration-300 ease-in-out`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      style={{
        background: isDarkMode
          ? 'linear-gradient(145deg, #2d3748, #1a202c)'
          : 'linear-gradient(145deg, #ffffff, #f7fafc)',
      }}
    >
      <div className="p-6 space-y-4">
        <div className="flex justify-center">
          <QuizIcon />
        </div>
        <h2 className="text-2xl font-bold text-center">{title}</h2>
        <p className="text-center text-gray-600 dark:text-gray-300">{description}</p>
        <div className="flex justify-center space-x-2">
          <Badge text={difficulty} type="difficulty" />
          <Badge text={`${questionCount} Questions`} type="questions" />
          {isTrending && <Badge text="Trending" type="trending" />}
        </div>
        <motion.button
          className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
         
        >
       <Link
        href={
          quizType === "open-ended"
            ? `/dashboard/openended/${slug}`
            : `/dashboard/mcq/${slug}`
        }
        passHref
        className="w-full"
      >Start Quiz</Link>
        </motion.button>
      </div>
    </motion.div>
  );
};
interface CardProps {
  quiz: Quiz;
}

// function QuizFooter({ quiz }: { quiz: CardProps["quiz"] }) {
//     return (
//       <Link
//         href={
//           quiz.gameType === "open-ended"
//             ? `/dashboard/openended/${slug}`
//             : `/dashboard/mcq/${slug}`
//         }
//         passHref
//         className="w-full"
//       >
//         <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group">
//           Take Quiz
//           <motion.span
//             className="ml-2"
//             initial={{ x: 0 }}
//             whileHover={{ x: 5 }}
//             transition={{ duration: 0.2 }}
//           >
//             <ArrowRight className="w-4 h-4" />
//           </motion.span>
//         </Button>
//       </Link>
//     );
//   }