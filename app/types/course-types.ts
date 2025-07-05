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
}

export interface Question {
  id: number;
  question: string;
  answer: string;
  options: string[];
}
