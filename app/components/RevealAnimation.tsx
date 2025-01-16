import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface RevealAnimationProps {
  children: ReactNode;
  delay?: number;
}

const RevealAnimation: React.FC<RevealAnimationProps> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

export default RevealAnimation;

