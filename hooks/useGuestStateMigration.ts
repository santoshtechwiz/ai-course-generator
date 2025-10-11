import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '../store/hooks';
import { useGuestState } from './useGuestState';
import { 
  initializeCourseState,
  setVideoProgress,
  setUserPlaybackSettings 
} from '../store/slices/course-slice';
import { migratedStorage } from '../lib/storage';

/**
 * Hook for migrating guest state to authenticated user state
 * Handles seamless transition from guest to authenticated user experience
 */
export function useGuestStateMigration() {
  const dispatch = useAppDispatch();
  const { status, data: session } = useSession();
  const { getGuestStateForMigration, guestProgress } = useGuestState();
  
  const isAuthenticated = status === 'authenticated';
  const userId = session?.user?.id as string | undefined;
  
  // Migrate guest course progress to authenticated user
  const migrateCourseProgress = useCallback(async (userId: string) => {
    const guestState = getGuestStateForMigration();
    if (!guestState) return { success: false, migrated: 0 };
    
    let migratedCount = 0;
    
    try {
      // Migrate course progress
      for (const [courseId, progress] of Object.entries(guestState.guestProgress)) {
        const userProgress = {
          ...progress,
          userId,
          lastUpdated: Date.now()
        };
        
        // Initialize user-specific course state
        dispatch(initializeCourseState({
          courseId: typeof courseId === 'string' ? parseInt(courseId) || 0 : courseId,
          courseSlug: courseId.toString(), // Add required courseSlug
          userId
        }));
        
        migratedCount++;
      }
      
      // Migrate video progress
      for (const [videoId, progress] of Object.entries(guestState.videoProgress)) {
        dispatch(setVideoProgress({
          videoId,
          time: progress.time,
          playedSeconds: progress.playedSeconds,
          duration: progress.duration,
          userId
        }));
      }
      
      // Migrate playback settings
      if (guestState.guestPlaybackSettings) {
        dispatch(setUserPlaybackSettings({
          userId,
          settings: guestState.guestPlaybackSettings
        }));
      }
      
      // Store migration record
      await migratedStorage.setItem(`migration_record_${userId}`, {
        migratedAt: Date.now(),
        guestCourses: migratedCount,
        guestVideos: Object.keys(guestState.videoProgress).length
      });
      
      return { success: true, migrated: migratedCount };
    } catch (error) {
      console.error('Guest state migration failed:', error);
      return { success: false, migrated: migratedCount, error };
    }
  }, [dispatch, getGuestStateForMigration]);
  
  // Clear guest state after successful migration
  const clearGuestState = useCallback(async () => {
    try {
      // Clear specific guest progress keys we know about
      const guestKeys = [
        'auth_intent',
        'guest_progress_summary',
        'guest_video_progress',
        'guest_playback_settings'
      ];
      
      // Add any video-specific keys
      Object.keys(guestProgress).forEach(courseId => {
        guestKeys.push(`guest_course_progress_${courseId}`);
      });
      
      for (const key of guestKeys) {
        await migratedStorage.removeItem(key);
      }
      
      // Note: Redux guest state will be cleared when user logs out
      return { success: true, cleared: guestKeys.length };
    } catch (error) {
      console.error('Failed to clear guest state:', error);
      return { success: false, error };
    }
  }, [guestProgress]);
  
  // Restore user context after migration
  const restoreUserContext = useCallback(async (userId: string) => {
    try {
      const migrationRecord = await migratedStorage.getItem(`migration_record_${userId}`) as any;
      
      if (!migrationRecord) {
        return { hasContext: false };
      }
      
      return {
        hasContext: true,
        context: {
          lastMigration: new Date(migrationRecord.migratedAt),
          migratedCourses: migrationRecord.guestCourses,
          migratedVideos: migrationRecord.guestVideos
        }
      };
    } catch (error) {
      console.error('Failed to restore user context:', error);
      return { hasContext: false, error };
    }
  }, []);
  
  // Auto-migrate when user authenticates
  const performAutoMigration = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    
    const hasGuestState = Object.keys(guestProgress).length > 0;
    if (!hasGuestState) return;
    
    console.log(`[useGuestStateMigration] Auto-migrating guest state for user ${userId}`);
    
    const migrationResult = await migrateCourseProgress(userId);
    
    if (migrationResult.success) {
      console.log(`[useGuestStateMigration] Migration successful: ${migrationResult.migrated} courses migrated`);
      
      // Clear guest state after successful migration
      await clearGuestState();
      
      // Store welcome context for UI
      await migratedStorage.setItem(`migration_welcome_${userId}`, {
        showWelcome: true,
        migratedCourses: migrationResult.migrated,
        timestamp: Date.now()
      });
    } else {
      console.error('[useGuestStateMigration] Migration failed:', migrationResult.error);
    }
    
    return migrationResult;
  }, [isAuthenticated, userId, guestProgress, migrateCourseProgress, clearGuestState]);
  
  // Check if user needs to see migration welcome
  const checkMigrationWelcome = useCallback(async (userId: string) => {
    try {
      const welcomeData = await migratedStorage.getItem(`migration_welcome_${userId}`) as any;
      
      if (welcomeData && welcomeData.showWelcome) {
        return {
          shouldShow: true,
          migratedCourses: welcomeData.migratedCourses,
          migratedAt: new Date(welcomeData.timestamp)
        };
      }
      
      return { shouldShow: false };
    } catch (error) {
      console.error('Failed to check migration welcome:', error);
      return { shouldShow: false };
    }
  }, []);
  
  // Dismiss migration welcome
  const dismissMigrationWelcome = useCallback(async (userId: string) => {
    try {
      await migratedStorage.removeItem(`migration_welcome_${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to dismiss migration welcome:', error);
      return { success: false };
    }
  }, []);
  
  // Auto-trigger migration on authentication
  useEffect(() => {
    if (isAuthenticated && userId) {
      performAutoMigration();
    }
  }, [isAuthenticated, userId, performAutoMigration]);
  
  return {
    // Migration actions
    migrateCourseProgress,
    clearGuestState,
    performAutoMigration,
    
    // Context restoration
    restoreUserContext,
    checkMigrationWelcome,
    dismissMigrationWelcome,
    
    // State
    isAuthenticated,
    userId,
    hasGuestState: Object.keys(guestProgress).length > 0
  };
}