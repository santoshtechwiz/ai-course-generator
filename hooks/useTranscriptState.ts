import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface TranscriptState {
  transcript: string[];
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export function useTranscriptState(videoId: string | undefined, chapterId: number | undefined) {
  const [state, setState] = useState<TranscriptState>({
    transcript: [],
    isLoading: false,
    error: null,
    progress: 0,
  });

  const fetchTranscript = useCallback(async () => {
    if (!videoId || !chapterId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axios.post('/api/transcript', { videoId, chapterId });
      setState(prev => ({
        ...prev,
        transcript: response.data.transcript,
        isLoading: false,
        progress: response.data.progress || 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch transcript. Please try again.',
      }));
    }
  }, [videoId, chapterId]);

  useEffect(() => {
    fetchTranscript();
  }, [fetchTranscript]);

  const updateProgress = useCallback((newProgress: number) => {
    setState(prev => ({ ...prev, progress: newProgress }));
  }, []);

  return { ...state, updateProgress, refetch: fetchTranscript };
}

