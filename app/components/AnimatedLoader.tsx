"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLoaderContext } from "../providers/LoadingContext"
import { GlobalLoader } from "./GlobalLoader"

const loaderVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const circleVariants = {
  hidden: { pathLength: 0 },
  visible: {
    pathLength: 1,
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Number.POSITIVE_INFINITY,
    },
  },
}

const pulseVariants = {
  hidden: { scale: 0.8, opacity: 0.5 },
  visible: {
    scale: 1.2,
    opacity: 1,
    transition: {
      duration: 1,
      yoyo: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export const AnimatedLoader = () => {
  const { isLoading } = useLoaderContext()

  return (
    <GlobalLoader loading={isLoading}></GlobalLoader>
  )
}

