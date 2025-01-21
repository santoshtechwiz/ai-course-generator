import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function CTA() {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button size="lg" className="px-8 py-3 text-lg font-semibold transition-all duration-300 ease-in-out">
        Start Learning Today
      </Button>
    </motion.div>
  )
}

