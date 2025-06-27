/**
 * Formats seconds into a human-readable time string
 */
export const formatDuration = (seconds: number): string => {
  // Handle invalid inputs
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  
  // Round to nearest integer to avoid floating point issues
  const totalSeconds = Math.round(seconds);
  
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  // Format with appropriate padding
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Calculates total duration of a course from chapters
 */
export const calculateCourseDuration = (chapters: Array<{ duration?: number | string }>): number => {
  return chapters.reduce((total, chapter) => {
    if (!chapter.duration) return total;
    
    // Handle string durations like "1:30" or numeric seconds
    if (typeof chapter.duration === 'string' && chapter.duration.includes(':')) {
      const parts = chapter.duration.split(':').map(Number);
      if (parts.length === 2) {
        return total + parts[0] * 60 + parts[1];
      }
      if (parts.length === 3) {
        return total + parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return total;
    }
    
    return total + Number(chapter.duration) || 0;
  }, 0);
};

/**
 * Calculates completion percentage for a course
 */
export const calculateCompletionPercentage = (
  completedChapters: string[] | number[],
  totalChapters: number
): number => {
  if (!completedChapters?.length || !totalChapters) return 0;
  return Math.round((completedChapters.length / totalChapters) * 100);
};

/**
 * Determines if a video should be considered complete
 */
export const isVideoComplete = (
  played: number, 
  threshold = 0.95
): boolean => {
  return played >= threshold;
};

/**
 * Gets estimated time to complete a course
 */
export const getEstimatedTimeToComplete = (
  totalDuration: number,
  completedDuration: number
): string => {
  const remainingSeconds = totalDuration - completedDuration;
  
  if (remainingSeconds <= 0) return "Completed";
  
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  
  return `${minutes} minutes remaining`;
};
