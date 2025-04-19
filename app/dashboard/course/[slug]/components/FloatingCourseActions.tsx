"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import CourseActionsWithErrorBoundary from "./CourseActions"

interface FloatingCourseActionsProps {
  slug: string
  position?: "left" | "right"
}

const FloatingCourseActions: React.FC<FloatingCourseActionsProps> = ({ slug, position = "left" }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOverlay = () => setIsOpen(!isOpen)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleOverlay}
        className={`fixed ${position}-4 bottom-20 sm:top-1/2 sm:-translate-y-1/2 z-50 bg-background shadow-md rounded-full p-2`}
        aria-label="Toggle course actions"
      >
        <Settings className="h-5 w-5" />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: position === "right" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position === "right" ? 20 : -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed ${position}-4 top-1/2 -translate-y-1/2 z-40 w-auto`}
          >
            <div className="bg-background border rounded-lg shadow-lg overflow-hidden">
              <div className="p-2">
                <CourseActionsWithErrorBoundary slug={slug} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingCourseActions
