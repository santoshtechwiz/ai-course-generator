import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const dimensions = {
    small: { width: 32, height: 32, fontSize: 16 },
    medium: { width: 40, height: 40, fontSize: 20 },
    large: { width: 48, height: 48, fontSize: 24 },
  };

  const { width, height, fontSize } = dimensions[size];

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => {
      const delay = i * 0.5;
      return {
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
          opacity: { delay, duration: 0.01 },
        },
      };
    },
  };

  return (
    <Link href="/" className="flex items-center space-x-2">
      <motion.div
        initial="hidden"
        animate="visible"
        className="relative"
        style={{ width, height }}
      >
        <svg
          width={width}
          height={height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Neural network lines */}
          <motion.path
            d="M30 30 L50 50 L70 30 M30 70 L50 50 L70 70"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            variants={draw}
            custom={1}
          />

          {/* Circuit board pattern */}
          <motion.path
            d="M20 50 H40 M60 50 H80 M50 20 V40 M50 60 V80"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            variants={draw}
            custom={2}
          />

          {/* AI text */}
          <motion.text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill="currentColor"
            className="text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            AI
          </motion.text>
        </svg>
      </motion.div>
      <motion.span
        className={`font-bold text-primary tracking-tight`}
        style={{ fontSize: `${fontSize}px` }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        CourseAI
      </motion.span>
    </Link>
  );
};

export default Logo;

