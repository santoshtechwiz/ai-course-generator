
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Globe, Lock } from 'lucide-react';
import Link from "next/link";
import { UserQuiz } from "@prisma/client";

interface QuizCardProps {
  quiz: UserQuiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold truncate">{quiz.topic}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <svg
            className="w-full h-full text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{quiz.quizType}</span>
          </div>
          <div className="flex items-center">
            {quiz.isPublic ? (
              <Globe className="w-4 h-4 mr-1" />
            ) : (
              <Lock className="w-4 h-4 mr-1" />
            )}
            <span>{quiz.isPublic ? 'Public' : 'Private'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/dashboard/quiz/${quiz.id}`}>Start Quiz</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
