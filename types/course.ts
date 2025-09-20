import { VideoStatus } from '@/app/services/video.service.types';

export interface Chapter {
  id: number;
  title: string;
  description: string;
  youtubeSearchQuery: string;
  videoId: string | null;
  videoStatus: VideoStatus;
  courseId: number;
  order: number;
  isActive: boolean;
}

export interface CourseUnit {
  id: number;
  title: string;
  description: string;
  courseId: number;
  order: number;
  chapters: Chapter[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  slug: string;
  authorId: string;
  isPublished: boolean;
  courseUnits: CourseUnit[];
}

export type CourseWithUnits = Course & {
  units: (CourseUnit & {
    chapters: Chapter[];
  })[];
};