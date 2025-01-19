import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BarChart, Clock, Award, TrendingUp, BookOpen, Calendar } from 'lucide-react';
import { UserStats } from '@/app/types';

interface UserStatsOverviewProps {
  stats: UserStats;
}

export function UserStatsOverview({ stats }: UserStatsOverviewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Your Learning Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Highest Score</p>
              <p className="text-2xl font-bold">{stats.highestScore.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Average Score</p>
              <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Total Quizzes</p>
              <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Total Time Spent</p>
              <p className="text-2xl font-bold">{Math.round(stats.totalTimeSpent / 60)} mins</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Quizzes per Month</p>
              <p className="text-2xl font-bold">{stats.quizzesPerMonth.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Recent Improvement</p>
              <p className="text-2xl font-bold">{stats.recentImprovement.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Top Performing Topics</h3>
          <ul className="space-y-2">
            {stats.topPerformingTopics.map((topic, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-sm">{topic.topic}</span>
                <span className="text-sm font-medium">{topic.averageScore.toFixed(1)}% ({topic.attempts} attempts)</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

