import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { setLoading, selectIsLoading, selectLoadingMessage } from '@/store/slices/uiSlice';

// Hook for managing global loading state
export function useLoading() {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const loadingMessage = useSelector(selectLoadingMessage);
  
  // Start loading with optional message
  const startLoading = useCallback(
    (message?: string) => {
      dispatch(setLoading({ isLoading: true, message }));
    },
    [dispatch]
  );
  
  // Stop loading
  const stopLoading = useCallback(() => {
    dispatch(setLoading({ isLoading: false }));
  }, [dispatch]);
  
  // Update loading message
  const updateLoadingMessage = useCallback(
    (message: string) => {
      if (isLoading) {
        dispatch(setLoading({ isLoading: true, message }));
      }
    },
    [dispatch, isLoading]
  );
  
  // Automatically stop loading on component unmount
  useEffect(() => {
    return () => {
      stopLoading();
    };
  }, [stopLoading]);
  
  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    updateLoadingMessage,
  };
}
