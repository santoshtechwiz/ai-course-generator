# AI Course Video Page

A modern, responsive course video page for learning platforms with premium content gating and engaging user experience.

## Features

### 🎥 Video Player
- **Placeholder Design**: Simple video player placeholder
- **Lock Overlay**: Premium content protection with subscription prompts
- **Progress Tracking**: Basic progress tracking functionality

### 📚 Course Management
- **Free/Paid Content**: First 2 videos free, rest behind subscription
- **Progress Tracking**: Visual progress indicators and completion status
- **Lesson Navigation**: Easy switching between course videos
- **Course Summary**: Detailed course information and learning objectives

### 🧠 Interactive Quizzes
- **Timed Assessments**: Configurable time limits for quizzes
- **Multiple Choice**: Rich question types with explanations
- **Progress Tracking**: Real-time quiz progress and scoring
- **Locked Content**: Quiz access based on subscription status

### 🎨 Modern UI/UX
- **Clean Design**: Minimal, premium aesthetic with ample whitespace
- **Responsive Layout**: Desktop-first design that works on all devices
- **Smooth Animations**: Hover effects and transitions throughout
- **Accessibility**: Keyboard navigation and screen reader support

### 💰 Subscription Features
- **Floating CTA**: Animated subscribe button for non-subscribers
- **Lock Indicators**: Clear visual cues for premium content
- **Upgrade Prompts**: Strategic placement of subscription calls-to-action
- **Progress Gating**: Content access based on subscription level

## Components

### Core Components
- `CourseVideoPage`: Main page component orchestrating all features
- `CourseSidebar`: Lesson navigation and course information
- `VideoDescription`: Rich video descriptions with transcript support
- `QuizSection`: Interactive quiz component with scoring

### Engagement Components
- `ProgressTracker`: Visual progress tracking with completion status
- `SubscribeButton`: Floating subscription call-to-action
- `RelatedCourses`: Course recommendations and discovery
- `CourseHeader`: Navigation and course metadata

## Usage

### Basic Implementation
```tsx
import { CourseVideoPage } from '@/components/course'

export default function CoursePage({ params }: { params: { courseId: string } }) {
  return <CourseVideoPage courseId={params.courseId} />
}
```

### Route Structure
```
/course/[courseId] - Main course video page
/demo/course - Demo redirect to sample course
```

### Data Structure
The page uses a custom hook `useCourseData` that provides:
- Course metadata (title, instructor, rating, etc.)
- Video array with thumbnails, descriptions, and URLs
- Quiz data with questions and answers
- Subscription status and access control

## Customization

### Styling
- Built with Tailwind CSS for easy customization
- CSS custom properties for theming
- Responsive breakpoints for all screen sizes

### Content Gating
- Configurable free video count (currently 2)
- Subscription status integration
- Custom lock overlays and messaging

### Quiz Configuration
- Time limits per quiz
- Question types and scoring
- Pass/fail thresholds
- Retry functionality

## Technical Details

### Performance
- Lazy loading for video thumbnails
- Optimized re-renders with React hooks
- Efficient state management
- Minimal bundle size

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement

## Demo

Visit `/demo/course` to see the page in action with sample AI course content.

## Future Enhancements

- Video quality selection
- Offline video download
- Social sharing features
- Advanced analytics tracking
- Multi-language support
- Dark mode theme