'use client';

import React from 'react';
import { useGuestProgress } from '@/hooks/useGuestProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';

interface GuestProgressIndicatorProps {
  courseId?: number | string;
  showSummary?: boolean;
  className?: string;
}

/**
 * Guest Progress Indicator Component
 * Shows learning progress for unauthenticated users
 */
export function GuestProgressIndicator({
  courseId,
  showSummary = false,
  className = ''
}: GuestProgressIndicatorProps) {
  const {
    isGuest,
    currentCourseProgress,
    getGuestCompletionStats,
    getGuestProgressSummary
  } = useGuestProgress(courseId);
  
  if (!isGuest) {
    return null; // Only show for guest users
  }
  
  if (showSummary) {
    const summary = getGuestProgressSummary();
    if (!summary || summary.totalCourses === 0) {
      return null;
    }
    
    return (
      <Card className={`bg-blue-50 border-blue-200 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-900 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Your Exploration Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-gray-600">
                {summary.totalCourses} course{summary.totalCourses > 1 ? 's' : ''} explored
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-gray-600">
                {summary.totalChapters} chapters viewed
              </span>
            </div>
          </div>
          
          {summary.completedCourses > 0 && (
            <div className="mt-3 p-2 bg-green-100 rounded-none">
              <p className="text-xs text-green-800">
                🎉 You've completed {summary.completedCourses} course{summary.completedCourses > 1 ? 's' : ''}!
                <span className="block mt-1 text-green-600">
                  Sign in to save your progress permanently.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Single course progress
  if (!courseId) {
    return null;
  }
  
  const stats = getGuestCompletionStats();
  if (!stats || stats.progressPercentage === 0) {
    return null;
  }
  
  return (
    <Card className={`bg-blue-50 border-4 border-blue-200 shadow-[4px_4px_0px_0px_hsl(var(--border))] ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">
            Your Progress
          </span>
          <span className="text-sm text-blue-600 font-semibold">
            {Math.round(stats.progressPercentage)}%
          </span>
        </div>
        
        <Progress 
          value={stats.progressPercentage} 
          className="h-2 mb-3 bg-blue-100"
        />
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{stats.completedChapters} chapters completed</span>
          {stats.isCompleted && (
            <span className="text-green-600 font-medium">✓ Completed</span>
          )}
        </div>
        
        {stats.progressPercentage > 10 && (
          <div className="mt-2 p-2 bg-blue-100 rounded-none">
            <p className="text-xs text-blue-800">
              💡 Sign in to save your progress and earn certificates!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}