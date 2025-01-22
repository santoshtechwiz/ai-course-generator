"use client"

import { motion } from "framer-motion"
import { TileGrid } from "../components/TileGrid"


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      <WavyBackground />
      <FloatingShapes />
      <main className="flex-grow flex flex-col justify-center items-center px-4 py-12 relative z-10">
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to Your Learning Journey
        </motion.h1>
        <motion.p
          className="text-xl text-center mb-12 max-w-2xl"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Explore our interactive learning tools and start creating engaging educational content today.
        </motion.p>

        {/* Tile Grid Section */}
        <TileGrid />
      </main>
    </div>
  )
}

export const WavyBackground = () => (
  <svg
    className="absolute inset-0 -z-10"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    preserveAspectRatio="none"
    viewBox="0 0 1440 560"
  >
    <path
      fill="currentColor"
      fillOpacity="0.05"
      d="M0,224L60,229.3C120,235,240,245,360,234.7C480,224,600,192,720,181.3C840,171,960,181,1080,181.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
    ></path>
  </svg>
)

export const FloatingShapes = () => (
  <svg
    className="absolute inset-0 -z-10"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    preserveAspectRatio="none"
    viewBox="0 0 1440 560"
  >
    <circle cx="100" cy="100" r="20" fill="currentColor" fillOpacity="0.1" />
    <rect x="300" y="300" width="40" height="40" fill="currentColor" fillOpacity="0.1" />
    <polygon points="1300,100 1320,150 1280,150" fill="currentColor" fillOpacity="0.1" />
  </svg>
)

