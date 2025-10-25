'use client';

import React from 'react';
import { useContextPreservation } from '@/hooks/useContextPreservation';
import { useGuestProgress } from '@/hooks/useGuestProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { signIn } from 'next-auth/react';
import { LogIn, Save, Star } from 'lucide-react';

interface ContextualSignInPromptProps {
  action: 'watch_video' | 'take_quiz' | 'continue_course' | 'save_progress';
  courseId?: string;
  videoId?: string;
  className?: string;
  variant?: 'inline' | 'modal' | 'banner';
}

/**
 * Contextual Sign In Prompt Component
 * Shows context-aware authentication prompts based on user actions
 */
export function ContextualSignInPrompt({
  action,
  courseId,
  videoId,
  className = '',
  variant = 'inline'
}: ContextualSignInPromptProps) {
  const { storeIntent } = useContextPreservation();
  const { getGuestProgressSummary } = useGuestProgress();
  
  const guestSummary = getGuestProgressSummary();
  
  const handleSignIn = async () => {
    // Store user intent before redirecting to sign in
    await storeIntent({
      action,
      courseId,
      videoId
    });
    
    // Get current page URL for redirect after authentication
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '/dashboard';
    
    // Redirect to sign in with current page as callback
    signIn('google', { callbackUrl: currentUrl });
  };
  
  const getPromptContent = () => {
    switch (action) {
      case 'watch_video':
        return {
          icon: <Star className="w-5 h-5" />,
          title: 'Sign in to save your progress',
          message: 'Continue watching and never lose your place in this course.',
          buttonText: 'Sign In & Continue'
        };
        
      case 'take_quiz':
        return {
          icon: <Save className="w-5 h-5" />,
          title: 'Sign in to take the quiz',
          message: 'Test your knowledge and earn completion certificates.',
          buttonText: 'Sign In & Take Quiz'
        };
        
      case 'continue_course':
        return {
          icon: <LogIn className="w-5 h-5" />,
          title: 'Sign in to continue learning',
          message: 'Pick up exactly where you left off and track your progress.',
          buttonText: 'Sign In & Continue'
        };
        
      case 'save_progress':
        const coursesText = guestSummary?.totalCourses || 0;
        return {
          icon: <Save className="w-5 h-5" />,
          title: 'Don\'t lose your progress!',
          message: `You've explored ${coursesText} course${coursesText > 1 ? 's' : ''}. Sign in to save everything.`,
          buttonText: 'Sign In & Save Progress'
        };
        
      default:
        return {
          icon: <LogIn className="w-5 h-5" />,
          title: 'Sign in to continue',
          message: 'Save your progress and unlock all features.',
          buttonText: 'Sign In'
        };
    }
  };
  
  const content = getPromptContent();
  
  if (variant === 'banner') {
    return (
      <div className={`bg-blue-600 text-white p-4 border-4 border-blue-700 shadow-[4px_4px_0px_0px_hsl(var(--border))] ${className}`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            {content.icon}
            <div>
              <p className="font-medium">{content.title}</p>
              <p className="text-blue-100 text-sm">{content.message}</p>
            </div>
          </div>
          <Button
            onClick={handleSignIn}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            {content.buttonText}
          </Button>
        </div>
      </div>
    );
  }
  
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {content.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {content.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {content.message}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleSignIn} className="w-full">
                {content.buttonText}
              </Button>
              <Button variant="ghost" className="w-full">
                Continue as Guest
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Default inline variant
  return (
    <Card className={`bg-blue-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            {content.icon}
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {content.title}
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              {content.message}
            </p>
            <Button 
              onClick={handleSignIn}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {content.buttonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}