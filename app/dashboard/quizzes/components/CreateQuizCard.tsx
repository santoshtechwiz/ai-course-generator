"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { PlusCircle, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const CreateQuizCard: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full flex flex-col justify-center items-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
        <CardContent className="text-center p-6">
          <motion.div
            animate={{
              rotate: isHovered ? 90 : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <PlusCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2 text-primary">Create Your Own Quiz</h3>
          <p className="text-muted-foreground mb-6">
            Didn't find what you're looking for? Create a custom quiz tailored to your needs!
          </p>
          <Link href="/dashboard/quiz" passHref>
            <Button className="group">
              Start Creating
              <motion.span className="ml-2" animate={{ x: isHovered ? 5 : 0 }} transition={{ duration: 0.2 }}>
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}

