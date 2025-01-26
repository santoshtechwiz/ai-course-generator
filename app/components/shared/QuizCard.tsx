"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Clock, Star, Zap, ArrowRight, HelpCircle, Brain, Trophy, CheckSquare, AlignLeft, FileInput
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface QuizCardProps {
  title: string;
  questionCount: number;
  slug: string;
  quizType: "mcq" | "openended" | "fill-blanks";
  estimatedTime?: string;
  description: string;
}

const quizTypeIcons = {
  mcq: CheckSquare,
  openended: AlignLeft,
  "fill-blanks": FileInput,
};

const quizTypeColors = {
  mcq: "from-blue-500 to-blue-600",
  openended: "from-green-500 to-green-600",
  "fill-blanks": "from-purple-500 to-purple-600",
};

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
};

const possibleTags = ["Trending", "New", "Popular"];

function getQuizTypeRoute(quizType: string): string {
  return quizType === "mcq"
    ? "mcq"
    : quizType === "openended"
      ? "openended"
      : quizType === "fill-blanks"
        ? "blanks"
        : "quiz";
}

const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const QuizTypeIcon = quizTypeIcons[quizType];

  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.2, rotate: 360, transition: { duration: 0.5 } },
  };

  const tags = possibleTags.filter(() => Math.random() > 0.5);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-sm mx-auto"
    >
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        className="h-full"
      >
        <Card
          className={cn(
            "overflow-hidden transition-all duration-300 h-full",
            "hover:shadow-lg hover:border-primary/20",
            "dark:bg-card dark:text-card-foreground"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardHeader className="relative p-6 pb-0">
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${quizTypeColors[quizType]} opacity-20`}
              animate={isHovered ? { opacity: 0.3 } : { opacity: 0.2 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="relative z-10 mb-4 mx-auto"
              variants={iconVariants}
            >
              <div className="size-20 mx-auto bg-background/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                <QuizTypeIcon className="size-10 text-primary" />
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <Badge variant="secondary" className={`font-medium ${quizTypeColors[quizType].split(' ')[1]} text-white`}>
                {quizTypeLabels[quizType]}
              </Badge>
              <Badge variant="outline" className="font-medium">
                <Clock className="size-3 mr-1" />
                {estimatedTime}
              </Badge>
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="default"
                  className={cn(
                    "font-medium",
                    tag === "Trending" && "bg-red-500 hover:bg-red-600",
                    tag === "New" && "bg-green-500 hover:bg-green-600",
                    tag === "Popular" && "bg-yellow-500 hover:bg-yellow-600"
                  )}
                >
                  {tag === "Trending" && <Zap className="size-3 mr-1" />}
                  {tag === "New" && <Star className="size-3 mr-1" />}
                  {tag === "Popular" && <Trophy className="size-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>

            <CardTitle className="text-2xl font-bold text-center relative z-10">
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
                <HelpCircle className="size-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">{questionCount} Questions</span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
                <Brain className="size-4 mr-2 text-indigo-500" />
                <span className="text-muted-foreground">Boost Knowledge</span>
              </motion.div>
            </div>
            <CardDescription className="text-center">{description}</CardDescription>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Link
              href={`/dashboard/${getQuizTypeRoute(quizType)}/${slug}`}
              className={cn(
                "w-full group relative overflow-hidden",
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "h-11 px-8 py-2", // This mimics the 'lg' size of the Button
              )}
            >
              <motion.span
                initial={{ x: 0 }}
                animate={isHovered ? { x: -10 } : { x: 0 }}
                className="relative z-10 flex items-center justify-center gap-2"
              >
                Start Quiz
                <motion.span
                  initial={{ x: -10, opacity: 0 }}
                  animate={isHovered ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="size-4" />
                </motion.span>
              </motion.span>
              <motion.div
                className={`absolute inset-0 ${quizTypeColors[quizType]}`}
                initial={{ x: "100%" }}
                animate={isHovered ? { x: "0%" } : { x: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export { QuizCard };
