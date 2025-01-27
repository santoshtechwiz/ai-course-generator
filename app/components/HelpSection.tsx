import type React from "react"
import { Info } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const HelpSection: React.FC = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            How does the answer matching work?
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <p>Our quiz uses advanced technology to match your answers:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>We don't just look for exact matches; we understand similar meanings.</li>
            <li>Partial matches are accepted if they're close enough to the correct answer.</li>
            <li>This system helps prevent spam and ensures fair grading.</li>
            <li>If your answer is close but not quite right, you'll be able to submit and get feedback.</li>
          </ul>
          <p className="mt-2">
            Tip: Focus on accuracy rather than trying multiple random guesses. This approach will give you the best
            learning experience and quiz results.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default HelpSection

