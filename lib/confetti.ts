// Simple confetti effect for celebrating streaks
export function createConfetti(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
  
    // Set canvas to full window size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  
    const particles: Particle[] = []
    const particleCount = 100
    const colors = ["#FFC700", "#FF0000", "#2E3191", "#41D3BD", "#8A2BE2", "#FF69B4"]
  
    interface Particle {
      x: number
      y: number
      size: number
      color: string
      speed: number
      angle: number
      rotation: number
      rotationSpeed: number
    }
  
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 15 + 5,
        angle: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.2 - 0.1,
      })
    }
  
    // Animation
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
  
      particles.forEach((particle) => {
        // Move particle
        particle.x += Math.cos(particle.angle) * particle.speed
        particle.y += Math.sin(particle.angle) * particle.speed + 0.5 // Add gravity
        particle.rotation += particle.rotationSpeed
        particle.speed *= 0.96 // Slow down
  
        // Draw particle
        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.fillStyle = particle.color
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
        ctx.restore()
      })
  
      if (particles.some((p) => p.speed > 0.1)) {
        requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  
    animate()
  }
  
  