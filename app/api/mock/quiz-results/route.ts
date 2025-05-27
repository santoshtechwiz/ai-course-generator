import { NextResponse } from 'next/server';

// Sample quiz results data for testing
const mockQuizResults = {
  title: "Angular Fundamentals Quiz",
  score: 0,
  maxScore: 10,
  percentage: 0,
  completedAt: new Date().toISOString(),
  slug: "angular-fundamentals",
  questionResults: [
    {
      questionId: "1",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "A new rendering pipeline and view engine for Angular",
      question: "What is Ivy in Angular?",
      skipped: true
    },
    {
      questionId: "2",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "To instantiate templates dynamically",
      question: "What is the primary purpose of ViewContainerRef in Angular?",
      skipped: true
    },
    {
      questionId: "3",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "It transforms Angular templates and components into JavaScript code",
      question: "What is the role of Angular compiler?",
      skipped: true
    },
    {
      questionId: "4",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "NgModule is used to declare directives, components, and pipes, while Module is a basic building block for Angular applications",
      question: "What is the difference between NgModule and Module in Angular?",
      skipped: true
    },
    {
      questionId: "5",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "To package Angular components as custom elements",
      question: "What is Angular Elements used for?",
      skipped: true
    },
    {
      questionId: "6",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "It monkey patches async operations to detect changes and update the view",
      question: "How does Angular's Zone.js work for change detection?",
      skipped: true
    },
    {
      questionId: "7",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "It provides a way to supply components with the services and data they need",
      question: "What is the purpose of Angular's dependency injection system?",
      skipped: true
    },
    {
      questionId: "8",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "To perform server-side rendering of Angular applications",
      question: "What is Angular Universal used for?",
      skipped: true
    },
    {
      questionId: "9",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "It provides reactive programming support for handling asynchronous operations in Angular apps",
      question: "What is RxJS and how does it relate to Angular?",
      skipped: true
    },
    {
      questionId: "10",
      isCorrect: false,
      userAnswer: null,
      correctAnswer: "It's a library for managing form validations and controls in Angular applications",
      question: "What is the purpose of Angular's Reactive Forms?",
      skipped: true
    }
  ],
  questions: [
    {
      id: "1",
      text: "What is Ivy in Angular?",
    },
    {
      id: "2",
      text: "What is the primary purpose of ViewContainerRef in Angular?",
    },
    {
      id: "3",
      text: "What is the role of Angular compiler?",
    },
    {
      id: "4",
      text: "What is the difference between NgModule and Module in Angular?",
    },
    {
      id: "5",
      text: "What is Angular Elements used for?",
    },
    {
      id: "6",
      text: "How does Angular's Zone.js work for change detection?",
    },
    {
      id: "7",
      text: "What is the purpose of Angular's dependency injection system?",
    },
    {
      id: "8",
      text: "What is Angular Universal used for?",
    },
    {
      id: "9",
      text: "What is RxJS and how does it relate to Angular?",
    },
    {
      id: "10",
      text: "What is the purpose of Angular's Reactive Forms?",
    }
  ]
};

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json(mockQuizResults);
}
