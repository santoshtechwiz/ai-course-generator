import { motion } from 'framer-motion';
import { BadgeProps } from '../types/quiz-card';

const badgeVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
};

export const Badge = ({ text, type }: BadgeProps) => {
  const getColorClass = () => {
    switch (type) {
      case 'difficulty':
        return 'bg-yellow-500 text-yellow-900';
      case 'questions':
        return 'bg-blue-500 text-blue-900';
      case 'trending':
        return 'bg-red-500 text-red-900';
      default:
        return 'bg-gray-500 text-gray-900';
    }
  };

  return (
    <motion.span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getColorClass()}`}
      variants={badgeVariants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.1 }}
    >
      {text}
    </motion.span>
  );
};

