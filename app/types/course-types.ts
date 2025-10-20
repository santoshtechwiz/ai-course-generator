// Structure for course content generation output
export type OutputUnits = {
  title: string;
  chapters: {
    youtube_search_query: string;
    chapter_title: string;
  }[];
}[];

// Course search parameters
export interface CourseSearchParams {
  search?: string;
  category?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Type for course update data
 */
export interface CourseUpdateData {
  title?: string;
  description?: string;
  isFavorite?: boolean;
  progress?: number;
  isPublic?: boolean;
}

/**
 * Type for course chapters update
 */
export interface CourseChaptersUpdate {
  courseId: number;
  slug: string;
  units: Array<{
    id: number;
    chapters: Array<{
      id: number | null;
      title: string;
      videoId: string | null;
      unitId: number;
      position: number;
      isCustom?: boolean;
      youtubeSearchQuery?: string;
    }>;
  }>;
}

/**
 * Type for chapter creation
 */
export interface ChapterInput {
  title: string;
  youtubeSearchQuery?: string;
  videoId?: string | null;
  unitId: number;
  position: number;
}

/**
 * Type for video status
 */
export type VideoStatus = "pending" | "processing" | "completed" | "error";

// Video and chapter related types
export interface VideoMetadata {
  id: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
}

export interface FullChapterType {
  id: number;
  title: string;
  description?: string;
  videoId: string | null; // Allow null for videoId
  order?: number;
  summary?: string | null;
  questions?: CourseQuestion[];
  name?: string; // Legacy support
  isFree?: boolean; // Added property - derived from context
  duration?: number | string; // Added property - calculated or provided
  videoDuration?: number | null; // Database field
  isFreePreview?: boolean; // Database field
  isCompleted?: boolean; // Database field
  youtubeSearchQuery?: string | null; // Database field
  summaryStatus?: string; // Database field
  videoStatus?: string; // Database field
  unitId?: number; // Database field
}

export interface CourseUnitType {
  id: number;
  title: string;
  order: number;
  chapters: FullChapterType[];
}

// Course unit with expanded chapter data
export interface FullCourseUnit {
  id: number;
  courseId: number;
  title: string;
  name: string; // Database field mapped to title
  isCompleted: boolean;
  duration: number | null;
  order: number;
  chapters: FullChapter[];
}

// Chapter with expanded quiz data
export interface FullChapter {
  id: number;
  title: string;
  videoId: string | null;
  order: number;
  isCompleted: boolean;
  summary: string | null;
  description: string | null;
  unitId: number;
  summaryStatus: string | null;
  videoStatus: string | null;
  questions: CourseQuestion[];
  isFree?: boolean; // Added property
  duration?: number | string; // Added property
}

// Course question with properly typed options
export interface CourseQuestion {
  id: number | string; // Accept both number and string IDs
  question: string;
  answer: string;
  options: string[] | string; // Allow string (for JSON parsing) or string array
  explanation?: string;
}

// User progress tracking for courses
export interface CourseProgress {
  id: number | string;
  userId: string;
  courseId: number | string;
  progress: number;
  completedChapters: (number | string)[];
  currentChapterId?: number | string;
  lastAccessedAt?: Date | string;
  isCompleted?: boolean;
  course?: FullCourseType;
  timeSpent?: number;
}

// Add or modify these types to ensure proper type checking
export interface FullCourseType {
  isPublic: boolean;
  id: number;
  title: string;
  slug: string;
  userId?: string;
  isCompleted: boolean;
  isShared?: boolean; // Flag to indicate course is being viewed via share link
  description?: string;
  image?: string;
  courseUnits: FullCourseUnit[]; // Ensure this is properly typed
  category?: {
    id: number;
    name: string;
  };
  instructor?: string;
  rating?: number;
  duration?: string;
  students?: number;
  level?: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  difficulty?: string;
  estimatedTime?: string;
}

// Course API response types
export interface FullCourse {
  id: number;
  title: string;
  description: string;
  image: string;
  viewCount: number;
  userId: string;
  categoryId: number;
  isCompleted: boolean;
  isPublic: boolean;
  slug: string;
  difficulty: any;
  estimatedHours: any;
  category: Category;
  ratings: Rating[];
  createdAt: string;
  updatedAt: string;
  courseUnits: CourseUnit[];
  courseProgress: CourseProgress[];
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: number;
  courseId: number;
  userId: string;
  rating: number;
  reviewText: any;
  createdAt: string;
  updatedAt: string;
}

export interface CourseUnit {
  id: number;
  courseId: number;
  title: string;
  isCompleted: boolean;
  duration: any;
  order: any;
  chapters: Chapter[];
}

export interface Chapter {
  id: number;
  title: string;
  videoId: string;
  order: number;
  isCompleted: boolean;
  summary: string;
  description: string;
  unitId: number;
  summaryStatus: string;
  videoStatus: string;
  isFree: boolean;
  duration: number;
  questions: Question[];
  youtubeSearchQuery?: string; // <-- PATCHED: add this property for compatibility
}

/**
 * Type for course creation parameters
 */
export interface CourseCreateParams {
  title: string;
  description?: string;
  image?: string;
  userId: string;
  categoryId: number;
  slug: string;
}

/**
 * Type for course filtering results
 */
export interface FilteredCourseResult {
  courses: any[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Enum for course difficulty levels
 */
export enum CourseDifficulty {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

/**
 * Interface for course stats
 */
export interface CourseStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  completedHours: number;
}

// Module types - extending CourseUnit concept
export interface ModuleCreateData {
  title: string;
  description?: string;
  courseId: number;
  order?: number;
  isRequired?: boolean;
  estimatedDuration?: number;
}

export interface ModuleUpdateData {
  title?: string;
  description?: string;
  order?: number;
  isRequired?: boolean;
  estimatedDuration?: number;
  isCompleted?: boolean;
}

export interface ModuleWithProgress extends CourseUnit {
  description?: string;
  isRequired: boolean;
  estimatedDuration: number;
  completionRate: number;
  chaptersCompleted: number;
  totalChapters: number;
  userProgress?: {
    isCompleted: boolean;
    completedChapters: number[];
    timeSpent: number;
    lastAccessedAt: Date;
  };
}

export interface ModuleSearchParams {
  courseId?: number;
  isCompleted?: boolean;
  isRequired?: boolean;
  orderBy?: 'title' | 'order' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface ModuleStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  averageProgress: number;
  totalChapters: number;
  completedChapters: number;
  estimatedTimeRemaining: number;
}

// Module operation result types
export interface ModuleOperationResult {
  success: boolean;
  message: string;
  module?: ModuleWithProgress;
}

export interface ModuleListResult {
  modules: ModuleWithProgress[];
  totalCount: number;
  stats: ModuleStats;
}
