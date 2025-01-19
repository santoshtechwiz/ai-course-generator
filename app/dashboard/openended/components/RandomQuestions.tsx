'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ChevronRight } from 'lucide-react'

import React from 'react'
import { QuizCard } from '@/app/components/shared/QuizCard'
import { QuizCardV2 } from '@/app/components/shared/QuizCardImproved'

interface QuizTopicSVGProps {
  className?: string
}



interface RandomQuestion {
  topic: string
  slug: string
  description: string
  imageUrl?: string,
  count:number,
}

interface RandomQuestionsProps {
  questions: RandomQuestion[]
}

export default function RandomQuestions({ questions }: RandomQuestionsProps) {
  console.log('questions', questions);
  return (
    // <Card className="h-full bg-card text-card-foreground">
    //   <CardHeader>
    //     <CardTitle className="text-lg text-primary flex justify-between items-center">
    //       <span>Random Open-Ended Quizzes</span>
    //       <Button variant="ghost" size="sm" className="text-xs">
    //         View All
    //         <ChevronRight className="ml-1 h-4 w-4" />
    //       </Button>
    //     </CardTitle>
    //   </CardHeader>
    //   <CardContent className="space-y-4 overflow-auto max-h-[calc(100vh-200px)] custom-scrollbar">
    //     <AnimatePresence>
    //       {questions.map((question, index) => (
    //         <motion.div
    //           key={question.slug}
    //           initial={{ opacity: 0, y: 20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           exit={{ opacity: 0, y: -20 }}
    //           transition={{ duration: 0.3, delay: index * 0.1 }}
    //         >
    //           <Link href={`/dashboard/openended/${question.slug}`}>
    //             <motion.div
    //               className="relative overflow-hidden rounded-lg shadow-md transition-all duration-300 ease-in-out"
    //               onMouseEnter={() => setHoveredIndex(index)}
    //               onMouseLeave={() => setHoveredIndex(null)}
    //               whileHover={{ scale: 1.03 }}
    //               whileTap={{ scale: 0.98 }}
    //             >
    //               <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-foreground/20 z-10" />
    //               {question.imageUrl ? (
    //                 <img
    //                   src={question.imageUrl || "/placeholder.svg"}
    //                   alt={question.topic}
    //                   className="w-full h-32 object-cover"
    //                 />
    //               ) : (
    //                 <QuizTopicSVG className="w-full h-32" />
    //               )}
    //               <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
    //                 <h3 className="text-white font-semibold mb-1">{question.topic}</h3>
    //                 <p className="text-white/80 text-sm line-clamp-2">{question.description}</p>
    //               </div>
    //               <Badge
    //                 variant="secondary"
    //                 className="absolute top-2 right-2 z-20 bg-primary text-white"
    //               >
    //                 Start Quiz
    //               </Badge>
    //             </motion.div>
    //           </Link>
    //         </motion.div>
    //       ))}
    //     </AnimatePresence>
    //   </CardContent>
    // </Card>
    <>
    {questions.map((question) => (
          
          <QuizCardV2 
          key={question.slug} 
          title={question.topic}
          description={question.description}
          difficulty="Easy"
          questionCount={question.count}
          isTrending={true}
          slug={question.slug}
          quizType="open-ended" />
    ))}
    
    </>

  )
}

