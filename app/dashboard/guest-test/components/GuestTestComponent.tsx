'use client';

import React, { useState } from 'react';
import { useGuestProgress } from '@/hooks/useGuestProgress';
import { useGuestVideoProgress } from '@/hooks/useGuestVideoProgress';
import { useContextPreservation } from '@/hooks/useContextPreservation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function GuestTestComponent() {
  const { status } = useSession();
  const [testCourseId] = useState('test-course-123');
  const [testVideoId] = useState('test-video-456');
  
  // Guest hooks
  const {
    isGuest,
    currentCourseProgress,
    markGuestChapterCompleted,
    setGuestCurrentChapter,
    updateGuestCourseProgressPercentage,
    getGuestCompletionStats,
    getGuestProgressSummary,
    trackGuestVideoWithCourse
  } = useGuestProgress(testCourseId);
  
  const {
    updateVideoProgressWithBackup,
    getVideoProgressPercentage,
    isVideoCompleted,
    getAllGuestVideoProgress
  } = useGuestVideoProgress(testVideoId);
  
  const {
    storeVideoWatchIntent,
    storeQuizTakeIntent,
    hasStoredIntent,
    intentContext
  } = useContextPreservation();
  
  const completionStats = getGuestCompletionStats();
  const progressSummary = getGuestProgressSummary();
  const videoProgress = getVideoProgressPercentage();
  const allVideoProgress = getAllGuestVideoProgress();
  
  const simulateVideoProgress = async () => {
    const progress = Math.random() * 100;
    const duration = 600; // 10 minutes
    const playedSeconds = (progress / 100) * duration;
    
    await updateVideoProgressWithBackup(testVideoId, progress, playedSeconds, duration);
    trackGuestVideoWithCourse(testVideoId, progress, playedSeconds, duration, testCourseId);
    
    console.log('Simulated video progress:', { progress, playedSeconds, duration });
  };
  
  const simulateChapterCompletion = () => {
    const chapterId = Math.floor(Math.random() * 10) + 1;
    markGuestChapterCompleted(chapterId);
    setGuestCurrentChapter(chapterId);
    updateGuestCourseProgressPercentage(75); // 75% course progress
    
    console.log('Simulated chapter completion:', chapterId);
  };
  
  const testIntentStorage = async () => {
    await storeVideoWatchIntent(testCourseId, testVideoId);
    console.log('Stored video watch intent');
  };
  
  const testQuizIntent = async () => {
    await storeQuizTakeIntent(testCourseId);
    console.log('Stored quiz take intent');
  };
  
  return (
    <div className="space-y-6">
      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={isGuest ? "secondary" : "default"}>
              {status === 'loading' ? 'Loading...' : isGuest ? 'Guest User' : 'Authenticated'}
            </Badge>
            <span className="text-sm text-gray-600">
              {isGuest ? 'Guest features should be active' : 'Guest features should be hidden'}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Guest Progress */}
      {isGuest && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Guest Course Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Course Progress</label>
                  <Progress value={completionStats?.progressPercentage || 0} className="mt-1" />
                  <span className="text-xs text-gray-500">
                    {Math.round(completionStats?.progressPercentage || 0)}% complete
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium">Video Progress</label>
                  <Progress value={videoProgress} className="mt-1" />
                  <span className="text-xs text-gray-500">
                    {Math.round(videoProgress)}% watched
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {completionStats?.completedChapters || 0}
                  </div>
                  <div className="text-sm text-gray-600">Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {progressSummary?.totalCourses || 0}
                  </div>
                  <div className="text-sm text-gray-600">Courses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(allVideoProgress).length}
                  </div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Guest Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={simulateVideoProgress} variant="outline">
                  Simulate Video Progress
                </Button>
                <Button onClick={simulateChapterCompletion} variant="outline">
                  Complete Chapter
                </Button>
                <Button onClick={testIntentStorage} variant="outline">
                  Test Video Intent
                </Button>
                <Button onClick={testQuizIntent} variant="outline">
                  Test Quiz Intent
                </Button>
              </div>
              
              {hasStoredIntent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-800">Stored Intent</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Action: {intentContext?.action}, Course: {intentContext?.courseId}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify({
                    currentCourseProgress,
                    completionStats,
                    progressSummary,
                    allVideoProgress: Object.keys(allVideoProgress),
                    intentContext
                  }, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {!isGuest && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p>Please log out to test guest features</p>
              <p className="text-sm mt-1">Guest components are only visible to unauthenticated users</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}