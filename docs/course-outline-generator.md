# Course Outline Generator

The Course Outline Generator is a service that uses AI to create comprehensive course outlines. It's built on top of the AI provider architecture, which means it can work with any supported AI provider (OpenAI, Google, etc.).

## Features

- Generates detailed course outlines with:
  - Course title and description
  - Target audience and prerequisites
  - Learning objectives
  - Key concepts with explanations
  - Practical exercises with difficulty levels and time estimates
  - Estimated course duration
  - Recommended resources for further learning
- Supports customization by skill level
- Allows focusing on specific areas of a topic
- Uses different AI models based on user subscription tier

## Usage Examples

### Basic Usage

```typescript
import { generateCourseOutline } from '@/lib/ai/services/course-outline-generator';

// Generate a course outline
const outline = await generateCourseOutline({
  topic: 'React Hooks',
  skillLevel: 'intermediate'
});

console.log(outline.title);
console.log(outline.description);
console.log(outline.learningObjectives);
```

### Advanced Usage

```typescript
import { CourseOutlineGenerator } from '@/lib/ai/services/course-outline-generator';
import { AIProviderFactory } from '@/lib/ai';

// Create a custom AI provider
const customProvider = AIProviderFactory.createProvider('google');

// Create a generator with the custom provider
const generator = new CourseOutlineGenerator(customProvider);

// Generate a course outline with specific focus areas
const outline = await generator.generateCourseOutline({
  topic: 'Machine Learning',
  skillLevel: 'advanced',
  focusAreas: ['Neural Networks', 'Computer Vision'],
  userType: 'PREMIUM'
});
```

### API Endpoint

The course outline generator is also available via an API endpoint:

```typescript
// Example client-side code
const response = await fetch('/api/courses/outline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'JavaScript Performance Optimization',
    skillLevel: 'intermediate',
    focusAreas: ['Memory Management', 'Render Performance']
  })
});

const data = await response.json();
const outline = data.courseOutline;
```

## Response Structure

The generated course outline follows this structure:

```typescript
interface CourseOutline {
  title: string;
  description: string;
  targetAudience: string[];
  prerequisiteKnowledge: string[];
  learningObjectives: {
    title: string;
    description: string;
  }[];
  keyConcepts: {
    concept: string;
    explanation: string;
  }[];
  practicalExercises: {
    title: string;
    description: string;
    difficultyLevel: "beginner" | "intermediate" | "advanced";
    estimatedTimeMinutes: number;
  }[];
  estimatedDurationHours: number;
  recommendedResources: string[];
}
```
