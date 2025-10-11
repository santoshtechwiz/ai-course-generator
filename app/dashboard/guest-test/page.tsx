import React from 'react';
import { GuestProgressIndicator, ContextualSignInPrompt } from '@/components/guest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GuestTestComponent from './components/GuestTestComponent';

/**
 * Guest System Test Page
 * This page demonstrates and tests guest functionality
 */
export default function GuestTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Guest System Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-800 mb-2">Testing Instructions</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. <strong>Log out</strong> to see guest features in action</li>
              <li>2. Guest progress is stored in localStorage</li>
              <li>3. Sign in prompts should appear after guest actions</li>
              <li>4. Progress should migrate after login</li>
              <li>5. Check browser console for debug logs</li>
            </ol>
          </div>
          
          <GuestTestComponent />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Guest UI Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Guest Progress Indicator</h3>
            <GuestProgressIndicator 
              courseId="test-course-1"
              showSummary={false}
              className="mb-4"
            />
            <GuestProgressIndicator 
              showSummary={true}
              className="mb-4"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Contextual Sign In Prompts</h3>
            <div className="space-y-4">
              <ContextualSignInPrompt 
                action="watch_video"
                courseId="test-course-1"
                videoId="test-video-1"
                variant="inline"
              />
              
              <ContextualSignInPrompt 
                action="take_quiz"
                courseId="test-course-1"
                variant="banner"
              />
              
              <ContextualSignInPrompt 
                action="save_progress"
                variant="inline"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}