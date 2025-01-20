

import { User } from "@prisma/client";

// Base Types
export interface BaseEntity {
  id: string | number
  createdAt?: Date
  updatedAt?: Date
}

// Quiz Types
export type QuizType = 'mcq' | 'open_ended'


export interface MCQQuestion {
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

export interface OpenEndedQuestion {
  question: string
  answer: string
  hints: string
  difficulty: string
  tags: string
}

export interface UserStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  completedCourses: number;
  totalTimeSpent: number;
  averageTimePerQuiz: number;
  topPerformingTopics: TopicPerformance[];
  recentImprovement: number;
  quizzesPerMonth: number;
}

interface TopicPerformance {
  topic: string;
  averageScore: number;
  attempts: number;
}

export interface DashboardUser extends User {
  courses: Course[];
  courseProgress: CourseProgress[];
  userQuizzes: UserQuiz[];
  subscriptions: UserSubscription | null;
  favorites: Favorite[];
  quizAttempts: QuizAttempt[];
}

export interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  highestScore: number;
  completedCourses: number;
  totalTimeSpent: number;
}

export interface Course {
  id: string;
  name: string;
  slug: string;
  createdAt: Date,
  updatedAt: Date,
  category: {
    id: number;
    name: string;
  } | null;
  courseUnits: {
    chapters: {
      id: string;
      questions: {
        id: string;
      }[];
    }[];
  }[];
}
export interface CourseProgress {
  id: number;
  progress: number;
  currentChapterId: number;
  completedChapters: string;
  timeSpent: number;
  isCompleted: boolean;
  course: Course;
}

export interface UserQuiz {
  id: number;
  topic: string;
  slug: string;
  timeStarted: Date;
  timeEnded: Date | null;
  quizType: string;
  questions: { id: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  planId: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export interface Favorite {
  id: number;
  course: Course;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  score: number | null;
  timeSpent: number | null;
  createdAt: Date;
  improvement: number | null;
  accuracy: number | null;
  QuizAttemptQuestion: {
    id: number;
    questionId: number;
    userAnswer: string | null;
    isCorrect: boolean | null;
    timeSpent: number;
  }[];
  quiz: {
    id: number;
    chapterId: number;
    question: string;
    answer: string;
  };
}
export class CourseAIErrors {

  constructor(public message: string, public code?: number) { }



}
export interface QuizCardProps {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  isTrending?: boolean;
  slug: string;
  quizType: string;
  estimatedTime: string;
}

export interface BadgeProps {
  text: string;
  type: 'difficulty' | 'questions' | 'trending';
}

export class FullCourseType{
  constructor(public course:Course, public courseProgress:CourseProgress[]){}
}

export interface RandomQuizProps{

  
}