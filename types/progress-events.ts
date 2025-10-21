// Event Types
export enum ProgressEventType {
  COURSE_STARTED = 'COURSE_STARTED',
  COURSE_PROGRESS_UPDATED = 'COURSE_PROGRESS_UPDATED',
  QUIZ_STARTED = 'QUIZ_STARTED',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  QUIZ_COMPLETED = 'QUIZ_COMPLETED',
  COURSE_COMPLETED = 'COURSE_COMPLETED',
  VIDEO_WATCHED = 'VIDEO_WATCHED',
  CHAPTER_COMPLETED = 'CHAPTER_COMPLETED'
}

// Base Event Interface
export interface BaseProgressEvent {
  id: string;
  userId: string;
  timestamp: number;
  type: ProgressEventType;
  entityId: string;
  entityType: 'course' | 'quiz' | 'chapter' | 'question' | 'video';
  metadata: Record<string, any>;
  batchId?: string;  // For grouping related events
  priority?: number; // For ordering events within a batch
  debounceKey?: string; // For debouncing similar events
}

// Video Events
export interface VideoWatchedEvent extends BaseProgressEvent {
  type: ProgressEventType.VIDEO_WATCHED;
  entityType: 'video';
  metadata: {
    courseId: string | number;
    chapterId: string | number;
    progress: number;
    playedSeconds: number;
    duration: number;
    timestamp: number;
  };
}

// Course Events
export interface CourseProgressUpdatedEvent extends BaseProgressEvent {
  type: ProgressEventType.COURSE_PROGRESS_UPDATED;
  entityType: 'course';
  metadata: {
    progress: number;
    completedChapters: number[];
    currentChapterId?: number;
    timeSpent: number;
  };
}

interface QuizStartedEvent extends BaseProgressEvent {
  type: ProgressEventType.QUIZ_STARTED;
  entityType: 'quiz';
  metadata: {
    quizType: string;
    quizSlug: string;
    totalQuestions: number;
  };
}

export interface QuestionAnsweredEvent extends BaseProgressEvent {
  type: ProgressEventType.QUESTION_ANSWERED;
  entityType: 'question';
  metadata: {
    quizId: string;
    questionIndex: number;
    selectedOptionId?: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  };
}

export interface QuizCompletedEvent extends BaseProgressEvent {
  type: ProgressEventType.QUIZ_COMPLETED;
  entityType: 'quiz';
  metadata: {
    score: number;
    maxScore: number;
    percentage: number;
    timeSpent: number;
    answers: Array<{
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  };
}

interface CourseStartedEvent extends BaseProgressEvent {
  type: ProgressEventType.COURSE_STARTED;
  entityType: 'course';
  metadata: {
    courseSlug: string;
    courseTitle: string;
  };
}

interface CourseCompletedEvent extends BaseProgressEvent {
  type: ProgressEventType.COURSE_COMPLETED;
  entityType: 'course';
  metadata: {
    totalTimeSpent: number;
    completionDate: string;
    finalScore?: number;
  };
}

export interface VideoWatchedEvent extends BaseProgressEvent {
  type: ProgressEventType.VIDEO_WATCHED;
  entityType: 'video';
  metadata: {
    courseId: string | number;
    chapterId: string | number;
    progress: number;
    playedSeconds: number;
    duration: number;
    timestamp: number;
  };
}

interface ChapterCompletedEvent extends BaseProgressEvent {
  type: ProgressEventType.CHAPTER_COMPLETED;
  entityType: 'chapter';
  metadata: {
    courseId: string;
    timeSpent: number;
    completedAt: string;
  };
}

// Union type of all possible events - define this once at the end
export type ProgressEvent =
  | CourseStartedEvent
  | CourseProgressUpdatedEvent
  | CourseCompletedEvent
  | QuizStartedEvent
  | QuestionAnsweredEvent
  | QuizCompletedEvent
  | VideoWatchedEvent
  | ChapterCompletedEvent
  | BaseProgressEvent;
