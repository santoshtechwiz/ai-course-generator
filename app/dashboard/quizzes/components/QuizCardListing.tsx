"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, BookOpen, PlusCircle, ArrowRight } from 'lucide-react';
import Link from "next/link";
import { useState } from "react";
import { Quiz } from "@/app/types";
import { QuizCardV2 } from "@/app/components/shared/QuizCardImproved";

interface CardProps {
  quiz: Quiz;
}

const QuizCardListing = ({ quiz, index }: { quiz: Quiz; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      key={quiz.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="h-full"
    >
      {/* <Card
        className="h-full flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-background to-background/80 border-2 border-primary/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader>
          <CardTitle className="text-xl font-semibold truncate text-primary">
            {quiz.topic}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between">
          <div>
            <div className="w-full h-40 mb-4 relative overflow-hidden rounded-md bg-gradient-to-br from-primary/20 to-secondary/20">
              <motion.svg
                className="w-full h-full text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ scale: 1, rotate: 0 }}
                animate={{ 
                  scale: isHovered ? 1.1 : 1,
                  rotate: isHovered ? 5 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </motion.svg>
            </div>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="flex items-center bg-primary/10 text-primary">
                <Clock className="w-3 h-3 mr-1" />
                {quiz.gameType}
              </Badge>
              <Badge
                variant={quiz.isPublic ? "default" : "outline"}
                className={`flex items-center ${quiz.isPublic ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'}`}
              >
                <Users className="w-3 h-3 mr-1" />
                {quiz.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-1" />
              {quiz.questionCount} questions
            </div>
          </div>
        </CardContent>
        <div className="p-4">
          <QuizFooter quiz={quiz} />
        </div>
      </Card> */}
      <QuizCardV2
        title={quiz.topic}
        description={quiz.description}
        difficulty={quiz.quizType}
        questionCount={quiz.questionCount}
        isTrending={quiz.isPublic}
        slug={quiz.slug}
        quizType={quiz.quizType}
      
      />
    </motion.div>
  );
};

const CreateQuizCard = () => {
  const [isHovered, setIsHovered] = useState(false);

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
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <PlusCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2 text-primary">Create Your Own Quiz</h3>
          <p className="text-muted-foreground mb-6">
            Didn't find what you're looking for? Create a custom quiz tailored
            to your needs!
          </p>
          <Link href="/dashboard/quiz" passHref>
            <Button className="group">
              Start Creating
              <motion.span
                className="ml-2"
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// function QuizFooter({ quiz }: { quiz: CardProps["quiz"] }) {
//   return (
//     <Link
//       href={
//         quiz.gameType === "open-ended"
//           ? `/dashboard/openended/${quiz.slug}`
//           : `/dashboard/mcq/${quiz.slug}`
//       }
//       passHref
//       className="w-full"
//     >
//       <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group">
//         Take Quiz
//         <motion.span
//           className="ml-2"
//           initial={{ x: 0 }}
//           whileHover={{ x: 5 }}
//           transition={{ duration: 0.2 }}
//         >
//           <ArrowRight className="w-4 h-4" />
//         </motion.span>
//       </Button>
//     </Link>
//   );
// }

export { QuizCardListing, CreateQuizCard };

