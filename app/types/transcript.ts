export type TranscriptProvider = 'vosk' | 'youtube' | 'api';

export interface TranscriptResult {
  status: number;
  message: string;
  transcript: string | null;
  shouldFallback?: boolean;
}

export interface TranscriptOptions {
  provider?: TranscriptProvider;
  preferOffline?: boolean;
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
}