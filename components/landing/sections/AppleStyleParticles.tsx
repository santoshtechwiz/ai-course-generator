import { motion } from "framer-motion"

interface AppleStyleParticlesProps {
  isHydrated?: boolean;
}

const AppleStyleParticles = ({ isHydrated = false }: AppleStyleParticlesProps) => {
  // Use fixed initial values for server rendering
  const initialParticles = [
    // Define static initial values for your particles
    // Example (adjust these to match your styling):
    { width: 25, height: 25, x: 25, y: 25, opacity: 0.2, filter: "blur(1px)", zIndex: 6 },
    { width: 30, height: 30, x: 10, y: 10, opacity: 0.2, filter: "blur(1px)", zIndex: 3 },
    // ...add more as needed
  ];
  
  // Safe fallback for random particles generation
  const generateRandomParticles = () => initialParticles
   
  // Only run animations when hydrated
  const particles = isHydrated 
    ? generateRandomParticles() // Your existing function to generate random particles
    : initialParticles;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          initial={isHydrated ? { x: `${particle.x}%`, y: `${particle.y}%` } : false}
          animate={isHydrated ? { 
            // Your existing animations
          } : false}
          style={{
            width: particle.width,
            height: particle.height,
            opacity: particle.opacity,
            zIndex: particle.zIndex,
            filter: `blur(${particle.filter}px)`,
            // Other styles
            willChange: "transform, opacity",
            background: `radial-gradient(circle, rgba(var(--primary-rgb), ${particle.opacity * 0.8}) 0%, rgba(var(--primary-rgb), 0) 70%)`,
          }}
          suppressHydrationWarning
        />
      ))}
    </div>
  );
};

export default AppleStyleParticles;
