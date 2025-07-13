"use client"

import { motion } from "framer-motion"
import { Frown, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RandomQuiz } from "@/app/dashboard/(quiz)/components/layouts/RandomQuiz"
import {
  FADE,
  SLIDE_UP,
  getStaggeredContainerAnimation,
  getStaggeredAnimation,
} from "@/components/ui/animations/animation-presets"
import { JsonLD } from "@/app/schema/components/json-ld"
import { notFoundStructuredData } from "@/app/utils/not-found-utils"
import AsyncNavLink from "@/components/loaders/AsyncNavLink"

export default function NotFound() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12 px-4 text-center bg-gradient-to-br from-background to-muted/20"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={FADE}
    >
      <JsonLD type="website" data={notFoundStructuredData} />

      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
      >
        <Frown className="h-24 w-24 text-primary/80 opacity-80" />
        <motion.div
          className="absolute inset-0 h-24 w-24 rounded-full bg-primary/10 animate-ping-slow"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
        variants={SLIDE_UP}
        transition={{ delay: 0.3 }}
      >
        {"404 - Page Not Found"}
      </motion.h1>

      <motion.p
        className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed"
        variants={SLIDE_UP}
        transition={{ delay: 0.4 }}
      >
        {
          "Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
        }
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-12"
        variants={getStaggeredContainerAnimation(0.1)}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={getStaggeredAnimation()}>
          <AsyncNavLink href="/" passHref>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Home className="mr-2 h-5 w-5" />
              {"Go to Homepage"}
            </Button>
          </AsyncNavLink>
        </motion.div>
        <motion.div variants={getStaggeredAnimation()}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            {"Go Back"}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {"Perhaps you'd like to try a random quiz?"}
        </h2>
        <div className="relative z-0">
          <RandomQuiz />
        </div>
      </motion.div>
    </motion.div>
  )
}
