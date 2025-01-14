import { useState, useEffect } from 'react';

export const useLoadingDots = (interval = 500) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return dots;
};

