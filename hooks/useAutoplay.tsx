import { useState, useEffect } from 'react'

export const useAutoPlay = (totalItems: number, onItemChange: (index: number) => void) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % totalItems)
          onItemChange((currentIndex + 1) % totalItems)
          return 0
        }
        return prevProgress + 1
      })
    }, 50)

    return () => clearInterval(interval)
  }, [currentIndex, totalItems, onItemChange])

  return { progress }
}
