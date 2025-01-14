import { useState, useEffect } from 'react'

export function useAutoPlay(totalItems: number, onItemChange: (index: number) => void) {
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoPlay) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            const nextIndex = (currentIndex + 1) % totalItems
            setCurrentIndex(nextIndex)
            onItemChange(nextIndex)
            return 0
          }
          return prevProgress + 1
        })
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isAutoPlay, currentIndex, totalItems, onItemChange])

  const toggleAutoPlay = () => setIsAutoPlay(!isAutoPlay)

  return { isAutoPlay, progress, toggleAutoPlay }
}

