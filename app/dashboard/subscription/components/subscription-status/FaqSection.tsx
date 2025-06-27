"use client"

import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { FAQ_ITEMS } from "../subscription-plans"

// Redesigned FAQSection component
export default function FAQSection() {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
        Frequently Asked Questions
      </h2>
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search FAQs..."
          className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="text-left text-base font-medium px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground px-4 pb-4 pt-2 bg-slate-50/50 dark:bg-slate-800/50">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/contact")}
          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
        >
          Contact Support
        </Button>
      </div>
    </div>
  )
}
