import { CourseService } from '@/app/services/course.service';
import { courseRepository } from '@/app/repositories/course.repository';
import { OutputUnits } from '@/app/types/course-types';

/**
 * Setup function for CourseService tests
 */
export function setupCourseServiceTest() {
  // Mock the repository methods
  const mockRepository = {
    findCourses: jest.fn(),
    findBySlug: jest.fn(),
    checkUserCredits: jest.fn(),
    generateUniqueSlug: jest.fn(),
    getOrCreateCategory: jest.fn(),
    createCourseWithUnits: jest.fn(),
    decrementUserCredits: jest.fn(),
    findChapterById: jest.fn(),
    updateChapterVideo: jest.fn(),
    updateCourseChapters: jest.fn(),
    update: jest.fn(),
    deleteCourse: jest.fn(),
    getCourseStatusForUser: jest.fn(),
    updateFavoriteStatus: jest.fn(),
  };

  // Replace the real repository with our mock
  Object.defineProperty(require('@/app/repositories/course.repository'), 'courseRepository', {
    value: mockRepository,
    writable: true,
  });

  // Mock the other dependencies
  jest.mock('@/lib/chatgpt/generateCourseContent', () => ({
    generateCourseContent: jest.fn(),
  }));

  jest.mock('@/lib/unsplash', () => ({
    getUnsplashImage: jest.fn(),
  }));

  // Return the mocked dependencies for test setup
  return {
    mockRepository,
    generateCourseContent: require('@/lib/chatgpt/generateCourseContent').generateCourseContent,
    getUnsplashImage: require('@/lib/unsplash').getUnsplashImage,
  };
}

/**
 * Test utility for setting up createCourse test data
 */
export function setupCreateCourseTest() {
  const userId = 'test-user-id';
  const courseData = {
    title: 'Test Course',
    units: ['Unit 1', 'Unit 2'],
    category: 'Test Category',
    description: 'Test Description',
  };

  const mockSlug = 'test-course';
  const mockOutputUnits: OutputUnits = [
    {
      title: 'Unit 1',
      chapters: [
        { youtube_search_query: 'test query 1', chapter_title: 'Chapter 1' },
      ],
    },
    {
      title: 'Unit 2',
      chapters: [
        { youtube_search_query: 'test query 2', chapter_title: 'Chapter 2' },
      ],
    },
  ];
  const mockImage = 'test-image-url';
  const mockCategoryId = 123;
  const mockCreatedCourse = {
    id: 1,
    title: 'Test Course',
    slug: mockSlug,
    // Add other required fields
  };

  return {
    userId,
    courseData,
    mockSlug,
    mockOutputUnits,
    mockImage,
    mockCategoryId,
    mockCreatedCourse,
  };
}
