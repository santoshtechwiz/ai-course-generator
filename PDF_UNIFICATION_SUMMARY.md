# Unified PDF Generation System

## Overview

This document describes the new unified PDF generation system that replaces multiple scattered PDF components with a single, reusable solution.

## Changes Made

### 1. Removed Old Components
- ❌ Deleted `/app/api/quizzes/[quizType]/[slug]/pdf/route.ts` - Server-side PDF generation
- ✅ Replaced with client-side PDF generation using @react-pdf/renderer

### 2. Created New Unified System
- ✅ `components/shared/UnifiedPdfGenerator.tsx` - Single component for all PDF needs
- ✅ Supports multiple content types: Quiz, Flashcards, Markdown, Course materials
- ✅ Highly configurable styling and layout options
- ✅ Consistent subscription checking and premium features

### 3. Updated Existing Components

#### QuizActions.tsx
- ❌ Removed `handlePdfDownload` API-based function
- ❌ Removed `isPdfGenerating` state
- ❌ Removed `canDownloadPDF` variable
- ✅ Added `pdfData` preparation logic
- ✅ Added `pdfConfig` configuration
- ✅ Integrated `UnifiedPdfGenerator` in both desktop and mobile views

#### QuizPdfButton.tsx
- ✅ Simplified to use `UnifiedPdfGenerator`
- ✅ Maintains backward compatibility
- ✅ Removed complex state management

#### DocumentQuizPdf.tsx
- ✅ Replaced complex PDF generation with `UnifiedPdfGenerator`
- ✅ Simplified `PDFDownloadButton` component
- ✅ Maintained existing interface for compatibility

#### PDFGenerator.tsx
- ✅ Completely rewritten to use `UnifiedPdfGenerator`
- ✅ Supports markdown content
- ✅ Simplified subscription checking

## Features

### Content Types Supported
1. **Quiz** - MCQ and open-ended questions
2. **Flashcards** - Question/answer pairs
3. **Markdown** - Rich text content
4. **Course** - Course materials and summaries

### Configuration Options
```typescript
interface PdfConfig {
  // Styling
  backgroundColor?: string
  primaryColor?: string
  secondaryColor?: string
  textColor?: string
  highlightColor?: string
  highlightBackground?: string
  
  // Content options
  showAnswers?: boolean
  highlightCorrectAnswers?: boolean
  showExplanations?: boolean
  showAnswerSpace?: boolean
  includeAnswerKey?: boolean
  
  // Layout
  questionsPerPage?: number
  padding?: number
  titleSize?: number
  
  // Footer
  showCopyright?: boolean
  copyrightText?: string
  copyrightPosition?: "left" | "center" | "right"
}
```

### Usage Examples

#### Basic Quiz PDF
```tsx
<UnifiedPdfGenerator
  data={{
    title: "Math Quiz",
    questions: [
      {
        question: "What is 2+2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1
      }
    ]
  }}
  type="quiz"
  config={{
    showAnswers: true,
    includeAnswerKey: true
  }}
/>
```

#### Flashcard PDF
```tsx
<UnifiedPdfGenerator
  data={{
    title: "Spanish Vocabulary",
    flashCards: [
      {
        question: "Hello",
        answer: "Hola"
      }
    ]
  }}
  type="flashcards"
  config={{
    showAnswers: false
  }}
/>
```

#### Markdown PDF
```tsx
<UnifiedPdfGenerator
  data={{
    title: "Chapter Summary",
    markdown: "# Introduction\nThis is the content..."
  }}
  type="markdown"
  config={{
    primaryColor: "#1D4ED8"
  }}
/>
```

## Benefits

1. **Consistency** - All PDFs use the same styling and layout system
2. **Maintainability** - Single component to maintain instead of multiple scattered implementations
3. **Performance** - Client-side generation reduces server load
4. **Flexibility** - Highly configurable for different use cases
5. **Reusability** - Can be used across the entire application
6. **Type Safety** - Full TypeScript support with proper interfaces

## Migration Guide

### For Developers
- Replace any usage of old PDF components with `UnifiedPdfGenerator`
- Update imports to use the new component
- Configure the component using the `PdfConfig` interface
- Remove any server-side PDF API calls

### Backward Compatibility
- All existing PDF buttons and components still work
- They now use the unified system under the hood
- No breaking changes to existing functionality

## File Structure
```
components/shared/
├── UnifiedPdfGenerator.tsx          # Main unified component
├── PDFGenerator.tsx                 # Updated markdown PDF generator
└── ...

app/dashboard/
├── (quiz)/components/
│   └── QuizActions.tsx              # Updated quiz actions
├── create/components/
│   └── QuizPdfButton.tsx           # Updated quiz PDF button
└── (quiz)/document/components/
    └── DocumentQuizPdf.tsx         # Updated document quiz PDF
```

## Testing

To test the unified PDF system:

1. **Quiz PDFs**: Navigate to any quiz and click "Download PDF"
2. **Flashcard PDFs**: Go to flashcard quizzes and test PDF download
3. **Document PDFs**: Test PDF generation in document quiz sections
4. **Markdown PDFs**: Test chapter summary PDF downloads

All functionality should work seamlessly with improved performance and consistency.
