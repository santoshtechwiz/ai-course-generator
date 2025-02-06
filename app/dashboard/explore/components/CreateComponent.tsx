"use client";

import { motion } from "framer-motion";
import { CreateTileGrid } from "./CreateTitleGrid";
import { WavyBackground } from "./WavyBackground";
import { FloatingShapes } from "./FloatingShapes";

export function CreateComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Background Effects */}
      <WavyBackground />
      <FloatingShapes />

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Animated Heading */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl  text-primary font-bold text-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
           
          Welcome to Your Learning Journey
        </motion.h1>

        {/* Animated Subheading */}
        <motion.p
          className="text-lg sm:text-xl text-center mb-8 sm:mb-12 max-w-2xl mx-4 sm:mx-0"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Explore our interactive learning tools and start creating engaging educational content today.
        </motion.p>

        {/* Tile Grid Section */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <CreateTileGrid />
        </div>
      </main>
    </div>
  );
}