import { useCallback, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGuestStateMigration } from './useGuestStateMigration';
import { migratedStorage } from '../lib/storage';

/**
 * Hook for managing context preservation during authentication flow
 * Ensures users return to their intended actions after login
 * SSR-safe with error boundaries
 */
export function useContextPreservation() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { checkMigrationWelcome, dismissMigrationWelcome } = useGuestStateMigration();
  
  const [intentContext, setIntentContext] = useState<{
    action?: string;
    courseId?: string;
    videoId?: string;
    timestamp?: number;
  } | null>(null);
  
  const [migrationWelcome, setMigrationWelcome] = useState<{
    show: boolean;
    migratedCourses: number;
    migratedAt: Date;
  } | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  
  const isAuthenticated = status === 'authenticated';
  const userId = session?.user?.id as string | undefined;
  
  // SSR guard
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Store user intent before authentication
  const storeIntent = useCallback(async (intent: {
    action: string;
    courseId?: string;
    videoId?: string;
    additionalData?: Record<string, any>;
  }) => {
    if (!isMounted) return { success: false };
    
    try {
      const intentData = {
        ...intent,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : ''
      };
      
      await migratedStorage.setItem('auth_intent', intentData);
      setIntentContext(intentData);
      
      console.log('[useContextPreservation] Intent stored:', intentData);
      return { success: true };
    } catch (error) {
      console.error('Failed to store authentication intent:', error);
      return { success: false };
    }
  }, [isMounted]);
  
  // Restore user intent after authentication
  const restoreIntent = useCallback(async () => {
    try {
      const storedIntent = await migratedStorage.getItem('auth_intent');
      
      if (storedIntent) {
        setIntentContext(storedIntent);
        return {
          hasIntent: true,
          intent: storedIntent
        };
      }
      
      return { hasIntent: false };
    } catch (error) {
      console.error('Failed to restore authentication intent:', error);
      return { hasIntent: false };
    }
  }, []);
  
  // Execute restored intent
  const executeIntent = useCallback(async (intent?: any) => {
    const targetIntent = intent || intentContext;
    if (!targetIntent) return { success: false };
    
    try {
      console.log('[useContextPreservation] Executing intent:', targetIntent);
      
      // Clear the intent first
      await migratedStorage.removeItem('auth_intent');
      setIntentContext(null);
      
      // Route based on action type
      switch (targetIntent.action) {
        case 'watch_video':
          if (targetIntent.courseId && targetIntent.videoId) {
            router.push(`/dashboard/course/${targetIntent.courseId}?video=${targetIntent.videoId}`);
          } else if (targetIntent.courseId) {
            router.push(`/dashboard/course/${targetIntent.courseId}`);
          }
          break;
          
        case 'take_quiz':
          if (targetIntent.courseId) {
            router.push(`/dashboard/course/${targetIntent.courseId}?tab=quiz`);
          }
          break;
          
        case 'continue_course':
          if (targetIntent.courseId) {
            router.push(`/dashboard/course/${targetIntent.courseId}`);
          }
          break;
          
        case 'browse_courses':
          router.push('/dashboard/home?tab=courses');
          break;
          
        case 'view_progress':
          router.push('/dashboard/home?tab=progress');
          break;
          
        default:
          // Fallback to stored URL or dashboard
          if (targetIntent.url && !targetIntent.url.includes('/auth/')) {
            router.push(targetIntent.url);
          } else {
            router.push('/dashboard/home');
          }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to execute intent:', error);
      return { success: false };
    }
  }, [intentContext, router]);
  
  // Check for migration welcome message
  const checkForMigrationWelcome = useCallback(async () => {
    if (!userId || !isMounted) return;
    
    try {
      const welcomeData = await checkMigrationWelcome(userId);
      
      if (welcomeData.shouldShow) {
        setMigrationWelcome({
          show: true,
          migratedCourses: welcomeData.migratedCourses || 0,
          migratedAt: welcomeData.migratedAt || new Date()
        });
      }
    } catch (error) {
      console.error('[useContextPreservation] Migration welcome check error:', error);
    }
  }, [userId, isMounted, checkMigrationWelcome]);
  
  // Dismiss migration welcome
  const handleDismissMigrationWelcome = useCallback(async () => {
    if (!userId || !isMounted) return;
    
    try {
      await dismissMigrationWelcome(userId);
      setMigrationWelcome(null);
    } catch (error) {
      console.error('[useContextPreservation] Dismiss welcome error:', error);
    }
  }, [userId, isMounted, dismissMigrationWelcome]);
  
  // Auto-restore context on authentication
  useEffect(() => {
    // Only run on client side after mount
    if (!isMounted) return;
    
    if (isAuthenticated && userId) {
      // Add timeout to prevent race conditions with SSR
      const timeoutId = setTimeout(() => {
        try {
          // Check for migration welcome first
          checkForMigrationWelcome();
          
          // Then restore intent
          restoreIntent();
        } catch (error) {
          console.error('[useContextPreservation] Auto-restore error:', error);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, userId, isMounted, checkForMigrationWelcome, restoreIntent]);
  
  // Generate contextual welcome message
  const getWelcomeMessage = useCallback(() => {
    if (!migrationWelcome?.show) return null;
    
    const { migratedCourses } = migrationWelcome;
    
    if (migratedCourses > 0) {
      return {
        title: "Welcome back!",
        message: `We've preserved your progress from ${migratedCourses} course${migratedCourses > 1 ? 's' : ''} you were exploring. Continue learning right where you left off!`,
        type: 'success' as const
      };
    }
    
    return {
      title: "Welcome to CourseAI!",
      message: "You're all set to start your learning journey. Explore our courses and track your progress.",
      type: 'info' as const
    };
  }, [migrationWelcome]);
  
  // Quick intent helpers for common actions
  const storeVideoWatchIntent = useCallback((courseId: string, videoId?: string) => {
    return storeIntent({
      action: 'watch_video',
      courseId,
      videoId
    });
  }, [storeIntent]);
  
  const storeQuizTakeIntent = useCallback((courseId: string) => {
    return storeIntent({
      action: 'take_quiz',
      courseId
    });
  }, [storeIntent]);
  
  const storeContinueCourseIntent = useCallback((courseId: string) => {
    return storeIntent({
      action: 'continue_course',
      courseId
    });
  }, [storeIntent]);
  
  return {
    // Intent management
    storeIntent,
    restoreIntent,
    executeIntent,
    intentContext,
    
    // Quick intent helpers
    storeVideoWatchIntent,
    storeQuizTakeIntent,
    storeContinueCourseIntent,
    
    // Migration welcome
    migrationWelcome,
    handleDismissMigrationWelcome,
    getWelcomeMessage,
    
    // State
    isAuthenticated,
    userId,
    hasStoredIntent: !!intentContext
  };
}