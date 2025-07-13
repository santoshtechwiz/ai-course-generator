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
        {/* Tile Grid Section */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <CreateTileGrid />
        </div>
      </main>
    </div>
  );
}
