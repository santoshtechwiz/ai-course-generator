"use client";
import { motion } from "framer-motion";
import { TileGrid } from "./TileGrid";
import { WavyBackground } from "./WavyBackground";
import { FloatingShapes } from "./FloatingShapes";

export function CreateComponent() {
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
  );
}
