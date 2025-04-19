"use client"

import React from "react"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { getStaggeredAnimation, getStaggeredContainerAnimation } from "./animation-presets"

type StaggeredListProps = {
  children: ReactNode
  className?: string
  staggerDuration?: number
  itemClassName?: string
}

export function StaggeredList({ children, className, staggerDuration = 0.05, itemClassName }: StaggeredListProps) {
  const containerAnimation = getStaggeredContainerAnimation(staggerDuration)
  const itemAnimation = getStaggeredAnimation()

  // Convert children to array to map over them
  const childrenArray = React.Children.toArray(children)

  return (
    <motion.ul className={className} initial="initial" animate="animate" exit="exit" variants={containerAnimation}>
      {childrenArray.map((child, index) => (
        <motion.li key={index} className={itemClassName} variants={itemAnimation}>
          {child}
        </motion.li>
      ))}
    </motion.ul>
  )
}
