import React from "react"
import { motion } from "framer-motion"
import { FeedbackButton } from "@/app/components/FeedbackButton"
import { Accordion } from "@/components/ui/accordion"
// Other imports as needed

export function FaqAccordion() {
  // Your existing code...

  return (
    <div className="container mx-auto px-4 md:px-6">
      {/* Your existing code... */}
      
      {/* Fix the nesting issue by not wrapping the button in a paragraph */}
      <motion.div 
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-muted-foreground">
          Have a question that's not listed?
        </span>
        {" "}
        <FeedbackButton variant="link" className="text-primary font-medium">
          Ask our team
        </FeedbackButton>
      </motion.div>
      
      {/* Your existing code... */}
    </div>
  )
}
