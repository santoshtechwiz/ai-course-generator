import { useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function ParallaxBackground() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 z-0"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        y: backgroundY,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-light-gray" />
    </motion.div>
  )
}

