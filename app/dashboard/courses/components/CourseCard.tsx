"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Book, FileQuestion, Star, Zap, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  name: string;
  description: string;
  rating: number;
  slug: string;
  unitCount: number;
  lessonCount: number;
  quizCount: number;
  userId: string;
  estimatedTime?: string;
  tags?: string[]; // Accept tags as props to avoid randomness
}

const DEFAULT_TAGS = ["Popular", "New"];

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  name,
  description,
  rating,
  slug,
  unitCount,
  lessonCount,
  quizCount,
  estimatedTime = "2-3 weeks",
  tags = DEFAULT_TAGS,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.2, rotate: 360, transition: { duration: 0.5 } },
  };

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
              className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-20"
              animate={isHovered ? { opacity: 0.3 } : { opacity: 0.2 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div className="relative z-10 mb-4 mx-auto" variants={iconVariants}>
              <div className="size-20 mx-auto bg-background/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                <Book className="size-10 text-primary" />
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <Badge variant="secondary" className="font-medium bg-primary text-primary-foreground">
                Course
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
                    tag === "Popular" && "bg-purple-500 hover:bg-purple-600",
                    tag === "New" && "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  {tag === "Popular" && <Zap className="size-3 mr-1" />}
                  {tag === "New" && <Zap className="size-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>

            <CardTitle className="text-2xl font-bold text-center relative z-10">{name}</CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
                <Book className="size-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">{lessonCount} Lessons</span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
                <FileQuestion className="size-4 mr-2 text-secondary" />
                <span className="text-muted-foreground">{quizCount || 5} Quizzes</span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
                <Star className="size-4 mr-2 text-yellow-500" />
                <span className="text-muted-foreground">{rating.toFixed(1)} Rating</span>
              </motion.div>
            </div>
            <CardDescription className="text-center">{description}</CardDescription>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Button asChild className="w-full group relative overflow-hidden" size="lg">
              <Link href={`/dashboard/course/${slug}`}>
                <motion.span
                  initial={{ x: 0 }}
                  animate={isHovered ? { x: -10 } : { x: 0 }}
                  className="relative z-10 flex items-center justify-center gap-2"
                >
                  Explore Course
                  <motion.span
                    initial={{ x: -10, opacity: 0 }}
                    animate={isHovered ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="size-4" />
                  </motion.span>
                </motion.span>
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ x: "100%" }}
                  animate={isHovered ? { x: "0%" } : { x: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};
export default CourseCard;