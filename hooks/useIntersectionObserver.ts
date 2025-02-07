"use client"

import { useEffect, useRef, useState } from "react"

interface UseIntersectionObserverProps {
  threshold?: number
  root?: Element | null
  rootMargin?: string
  onChange?: (entry: IntersectionObserverEntry) => void
}

export const useIntersectionObserver = ({
  threshold = 0,
  root = null,
  rootMargin = "0%",
  onChange,
}: UseIntersectionObserverProps) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const ref = useRef<Element | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
        if (onChange) onChange(entry)
      },
      { threshold, root, rootMargin },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, onChange])

  return { ref, entry }
}

