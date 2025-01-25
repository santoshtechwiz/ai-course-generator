"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useApiLoading } from "@/hooks/useApiLoading"

export function GlobalLoading(): JSX.Element {
  const isApiLoading = useApiLoading()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isApiLoading) {
      const timer = setTimeout(() => setIsVisible(true), 300) // Show loader after 300ms of loading
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isApiLoading])

  if (!isVisible) return <></>

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{ scaleX: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  )
}

