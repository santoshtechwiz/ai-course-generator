import { useCallback, useLayoutEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { hydrateStateFromStorage, restoreQuizAfterAuth } from "@/store/slices/quizSlice";
import { StorageService } from '@/lib/storage-service';

export function useQuizStateManager() {
  const { status } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const [stateInitialized, setStateInitialized] = useState(false);
  const storageService = StorageService.getInstance();
  
  // Use useLayoutEffect to ensure DOM updates are synchronized
  useLayoutEffect(() => {
    // Only initialize state once authentication status is determined
    if (status !== 'loading' && !stateInitialized) {
      const initializeState = async () => {
        try {
          // First, hydrate from storage for any non-auth dependent state
          await dispatch(hydrateStateFromStorage());
          
          // If authenticated, try to restore auth-dependent state
          if (status === 'authenticated') {
            try {
              await dispatch(restoreQuizAfterAuth());
            } catch (error) {
              console.error("Failed to restore auth-dependent quiz state:", error);
            }
          }
        } catch (error) {
          console.error("Error initializing quiz state:", error);
        } finally {
          // Mark initialization as complete regardless of errors
          setStateInitialized(true);
        }
      };
      
      initializeState();
    }
  }, [status, stateInitialized, dispatch]);
  
  const storeResults = useCallback((slug: string, results: any) => {
    storageService.storeQuizResults(slug, results);
  }, []);
  
  return { 
    isInitialized: stateInitialized, 
    storeResults 
  };
}
