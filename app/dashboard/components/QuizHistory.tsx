"use client";

import { useState } from "react";
import {
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, TrendingUp, RotateCcw } from "lucide-react";

interface QuizHistoryProps {
  quizzes: any[];
}

export default function QuizHistory({ quizzes }: QuizHistoryProps) {
  const [view, setView] = useState<"list" | "chart">("list");

  const calculateTimeSpent = (start: Date, end: Date) => {
    // Ensure end time is always later than start time
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = intervalToDuration({
      start: new Date(Math.min(startTime, endTime)),
      end: new Date(Math.max(startTime, endTime)),
    });
    return formatDuration(duration, { format: ["minutes", "seconds"] });
  };

  const averageScore =
    quizzes.length > 0
      ? quizzes.reduce((acc, quiz) => acc + quiz.score, 0) / quizzes.length
      : 0;

  const highestScore =
    quizzes.length > 0 ? Math.max(...quizzes.map((quiz) => quiz.score)) : 0;

  const totalTimeSpent = quizzes.reduce((acc, quiz) => {
    const startTime = new Date(quiz.timeStarted).getTime();
    const endTime = new Date(quiz.timeEnded).getTime();
    // Use absolute difference to prevent negative values
    return acc + Math.abs(endTime - startTime);
  }, 0);

  const chartData = quizzes.map((quiz) => ({
    topic: quiz.topic,
    score: quiz.score,
    slug: quiz.slug,
    date: new Date(quiz.timeStarted).toLocaleDateString(),
  }));

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Quiz Performance</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "list" ? "chart" : "list")}
          >
            {view === "list" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Average Score</p>
                    <p className="text-2xl font-bold">
                      {averageScore.toFixed(1)}%
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Highest Score</p>
                    <p className="text-2xl font-bold">{highestScore}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(
                        intervalToDuration({
                          start: 0,
                          end: totalTimeSpent,
                        }),
                        { format: ["hours", "minutes"] }
                      )}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {view === "chart" ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{quiz.topic}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {calculateTimeSpent(quiz.timeStarted, quiz.timeEnded)}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(quiz.timeStarted))} ago
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={quiz.score >= 70 ? "default" : "destructive"}
                    >
                      {quiz.score}%
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/dashboard/${
                          quiz.gameType === "open-ended" ? "openended" : "mcq"
                        }/${quiz.slug}`}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
