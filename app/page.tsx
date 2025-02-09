"use client"

import { SparklesCore } from "./components/animations/sparkles"
import LandingComponent from "./components/landing/LandingComponent"

export default function Home() {
  return (
    <main className="min-h-screen bg-background antialiased relative overflow-hidden">
      {/* Ambient background with moving particles */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          theme="dark" 
        />
      </div>

      <div className="relative z-10">
        <LandingComponent />
      </div>
    </main>
  )
}