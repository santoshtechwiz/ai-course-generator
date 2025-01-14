'use client'
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RandomQuizProps } from "@/app/types";

const RandomQuiz: React.FC<RandomQuizProps> = ({ games }) => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const displayedGames = showAll ? games : games.slice(0, 3);

  const handleGameSelection = (slug: string) => {
    setSelectedGame(slug);
  };

  const handleStartQuiz = (slug: string) => {
    router.push(`/quiz/${slug}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-secondary p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Random Quiz</h2>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close quiz selection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Quiz Cards */}
        <div className="p-4">
          <div className="grid gap-4">
            <AnimatePresence initial={false}>
              {displayedGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  layout
                >
                  <Card
                    className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md border ${
                      selectedGame === game.id
                        ? "ring-2 ring-primary"
                        : "hover:border-primary"
                    }`}
                    onClick={() => handleGameSelection(game.slug)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">
                          {game.topic}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Brain className="h-4 w-4" />
                          <span>{game.totalQuestions} Questions</span>
                        </div>
                      </div>
                      <CardDescription className="text-sm text-muted-foreground">
                        Test your {game.topic} knowledge
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartQuiz(game.slug);
                        }}
                      >
                        Start Quiz
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Show More/Less Button */}
          {games.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="w-full"
              >
                {showAll ? (
                  <>
                    Show Less
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show More
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RandomQuiz;

