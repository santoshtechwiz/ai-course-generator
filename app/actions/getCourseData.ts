'use server'

import prisma from "@/lib/db";
import { FullCourseType } from "../types/types";

export async function getCourseData(slug: string): Promise<FullCourseType | null> {
    const course = await prisma.course.findFirst({
      where: { slug },
      include: {
        category: true,
        courseUnits: {
          include: {
            chapters: {
              include: {
                courseQuizzes: true,
              },
            },
          },
        },
        courseProgress: {
          include: {
            user: true,
          },
        },
      },
    });
  
    if (!course) return null;
  
    // Fetch quiz attempts for all questions in the course
    const quizAttempts = await prisma.userQuizAttempt.findMany({
      where: {
        userQuiz: {
          questions: {
            some: {
              userQuizId: course.id,
            },
          },
        },
      },
      include: {
        user: true,
        userQuiz: {
          include: {
            questions: true,
          },
        },
        attemptQuestions: true,
      },
    });
  
    const fullCourse: FullCourseType = {
      
      ...course,
      courseUnits: course.courseUnits.map(unit => ({
        ...unit,
        chapters: unit.chapters.map(chapter => ({
          ...chapter,
          questions: chapter.courseQuizzes.map(question => ({
            ...question,
            attempts: quizAttempts
              .filter(attempt => attempt.userQuiz.questions.some(q => q.id === question.id))
              .map(attempt => ({
                ...attempt,
                attemptQuestions: attempt.attemptQuestions.filter(aq => aq.questionId === question.id),
              })),
          })),
        })),
      })),
    };
  
    return fullCourse;
  }