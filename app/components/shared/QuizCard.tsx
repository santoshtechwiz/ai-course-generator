'use client';

import { motion } from 'framer-motion';
import { QuizIcon } from './QuizIcon';
import { Badge } from './Badge';
import { useColorScheme } from '@/hooks/useColorScheme';
import { QuizCardProps } from '@/app/types';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const cardVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  hover: { scale: 1.05, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
};

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  description,
  difficulty,
  questionCount,
  isTrending,
  slug,
  quizType,
}) => {
  const isDarkMode = useColorScheme();

  const backgroundStyle = {
    background: isDarkMode
      ? 'linear-gradient(145deg, #2d3748, #1a202c)'
      : 'linear-gradient(145deg, #ffffff, #f7fafc)',
  };

  return (
    <motion.div
      className="transition-transform duration-300 ease-in-out"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Card
        className={`w-full max-w-sm rounded-lg shadow-lg ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}
        style={backgroundStyle}
      >
        <CardHeader>
          <QuizIcon className="mx-auto" />
          <h2 className="text-2xl font-bold text-center mt-4">{title}</h2>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-300">{description}</p>
          <div className="flex justify-center space-x-2">
            <Badge text={difficulty} type="difficulty" />
            <Badge text={`${questionCount} Questions`} type="questions" />
            {isTrending && <Badge text="Trending" type="trending" />}
          </div>
        </CardContent>
        <CardFooter className="p-6">
          <Link
            href={`/dashboard/${quizType === 'open-ended' ? 'openended' : 'mcq'}/${slug}`}
            passHref
            className="block w-full"
          >
            <Button
              className="w-full"
              variant="primary"
              aria-label={`Start ${title} quiz`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Quiz
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
