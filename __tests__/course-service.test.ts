import { courseService } from '@/app/services/course.service';
import { courseRepository } from '@/app/repositories/course.repository';
import { generateCourseContent } from '@/lib/chatgpt/generateCourseContent';
import { getUnsplashImage } from '@/lib/unsplash';
import { setupCreateCourseTest } from './helpers/course-service-helper';

// Mock dependencies
jest.mock('@/app/repositories/course.repository', () => ({
  courseRepository: {
    checkUserCredits: jest.fn(),
    generateUniqueSlug: jest.fn(),
    getOrCreateCategory: jest.fn(),
    createCourseWithUnits: jest.fn(),
    decrementUserCredits: jest.fn(),
    findBySlug: jest.fn(),
    updateFavoriteStatus: jest.fn(),
    update: jest.fn(),
    deleteCourse: jest.fn(),
    getCourseStatusForUser: jest.fn(),
  },
}));

jest.mock('@/lib/chatgpt/generateCourseContent', () => ({
  generateCourseContent: jest.fn(),
}));

jest.mock('@/lib/unsplash', () => ({
  getUnsplashImage: jest.fn(),
}));

describe('CourseService', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a new course successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const courseData = {
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript basics',
        units: ['Variables', 'Functions', 'Interfaces'],
        category: 'Programming',
      };
      
      const mockSlug = 'introduction-to-typescript';
      const mockOutputUnits = [
        {
          title: 'Variables',
          chapters: [
            { title: 'Basic Types', youtube_search_query: 'TypeScript basic types' },
          ],
        },
        {
          title: 'Functions',
          chapters: [
            { title: 'Function Parameters', youtube_search_query: 'TypeScript function parameters' },
          ],
        },
      ];
      const mockCourseImage = 'https://example.com/image.jpg';
      const mockCategoryId = 1;
      const mockCreatedCourse = {
        id: 1,
        title: 'Introduction to TypeScript',
        slug: mockSlug,
        image: mockCourseImage,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      (courseRepository.checkUserCredits as jest.Mock).mockResolvedValue({ credits: 5 });
      (courseRepository.generateUniqueSlug as jest.Mock).mockResolvedValue(mockSlug);
      (generateCourseContent as jest.Mock).mockResolvedValue(mockOutputUnits);
      (getUnsplashImage as jest.Mock).mockResolvedValue(mockCourseImage);
      (courseRepository.getOrCreateCategory as jest.Mock).mockResolvedValue(mockCategoryId);
      (courseRepository.createCourseWithUnits as jest.Mock).mockResolvedValue(mockCreatedCourse);
      (courseRepository.decrementUserCredits as jest.Mock).mockResolvedValue({ id: userId, credits: 4 });

      // Act
      const result = await courseService.createCourse(userId, courseData);

      // Assert
      expect(result).toEqual({ slug: mockSlug });
      
      // Verify all repository calls were made correctly
      expect(courseRepository.checkUserCredits).toHaveBeenCalledWith(userId);
      expect(courseRepository.generateUniqueSlug).toHaveBeenCalledWith(courseData.title);
      expect(generateCourseContent).toHaveBeenCalledWith(courseData.title, courseData.units);
      expect(getUnsplashImage).toHaveBeenCalledWith(courseData.title);
      expect(courseRepository.getOrCreateCategory).toHaveBeenCalledWith(courseData.category);
      expect(courseRepository.createCourseWithUnits).toHaveBeenCalledWith(
        expect.objectContaining({
          title: courseData.title,
          description: courseData.description,
          image: mockCourseImage,
          userId,
          categoryId: mockCategoryId,
          slug: mockSlug,
        }),
        mockOutputUnits
      );
      expect(courseRepository.decrementUserCredits).toHaveBeenCalledWith(userId);
    });

    it('should throw an error when user has insufficient credits', async () => {
      // Arrange
      const userId = 'user-123';
      const courseData = {
        title: 'Introduction to TypeScript',
        units: ['Variables', 'Functions', 'Interfaces'],
        category: 'Programming',
        description: 'Learn TypeScript basics',
      };

      // Mock error for insufficient credits
      (courseRepository.checkUserCredits as jest.Mock).mockRejectedValue(new Error('Insufficient credits'));

      // Act and Assert
      await expect(courseService.createCourse(userId, courseData)).rejects.toThrow('Insufficient credits');
      
      // Verify that only the credit check was called
      expect(courseRepository.checkUserCredits).toHaveBeenCalledWith(userId);
      expect(courseRepository.generateUniqueSlug).not.toHaveBeenCalled();
      expect(generateCourseContent).not.toHaveBeenCalled();
    });

    it('should throw an error when course content generation fails', async () => {
      // Arrange
      const userId = 'user-123';
      const courseData = {
        title: 'Introduction to TypeScript',
        units: ['Variables', 'Functions', 'Interfaces'],
        category: 'Programming',
        description: 'Learn TypeScript basics',
      };

      const mockSlug = 'introduction-to-typescript';

      // Setup mocks - allow credit check to pass but make content generation fail
      (courseRepository.checkUserCredits as jest.Mock).mockResolvedValue({ credits: 5 });
      (courseRepository.generateUniqueSlug as jest.Mock).mockResolvedValue(mockSlug);
      (generateCourseContent as jest.Mock).mockRejectedValue(new Error('Content generation failed'));

      // Act and Assert
      await expect(courseService.createCourse(userId, courseData)).rejects.toThrow('Content generation failed');
      
      // Verify the expected calls were made up to the failing point
      expect(courseRepository.checkUserCredits).toHaveBeenCalledWith(userId);
      expect(courseRepository.generateUniqueSlug).toHaveBeenCalledWith(courseData.title);
      expect(generateCourseContent).toHaveBeenCalledWith(courseData.title, courseData.units);
      expect(getUnsplashImage).not.toHaveBeenCalled();
    });
  });

  describe('updateCourseBySlug', () => {
    it('should update a course successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const slug = 'test-course';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        isPublic: true,
      };
      
      const mockCourse = {
        id: 1,
        title: 'Original Title',
        description: 'Original Description',
        isPublic: false,
        userId,
      };
      
      const mockUpdatedCourse = {
        ...mockCourse,
        title: updateData.title,
        description: updateData.description,
        isPublic: updateData.isPublic,
        courseUnits: [],
        category: null,
      };

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(mockCourse);
      (courseRepository.update as jest.Mock).mockResolvedValue(mockUpdatedCourse);

      // Act
      const result = await courseService.updateCourseBySlug(slug, userId, updateData);

      // Assert
      expect(result).toEqual({ success: true, course: mockUpdatedCourse });
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.update).toHaveBeenCalledWith(mockCourse.id, updateData);
    });

    it('should handle favorite status update', async () => {
      // Arrange
      const userId = 'user-123';
      const courseId = 1;
      const slug = 'test-course';
      const updateData = {
        isFavorite: true,
      };
      
      const mockCourse = {
        id: courseId,
        title: 'Test Course',
        userId,
      };

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(mockCourse);
      (courseRepository.updateFavoriteStatus as jest.Mock).mockResolvedValue({ userId, courseId });
      (courseRepository.update as jest.Mock).mockResolvedValue({
        ...mockCourse,
        courseUnits: [],
        category: null,
      });

      // Act
      const result = await courseService.updateCourseBySlug(slug, userId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.updateFavoriteStatus).toHaveBeenCalledWith(userId, courseId, true);
      // Ensure isFavorite was removed from updates
      expect(courseRepository.update).toHaveBeenCalledWith(courseId, {});
    });

    it('should throw an error when course is not found', async () => {
      // Arrange
      const userId = 'user-123';
      const slug = 'non-existent-course';
      const updateData = { title: 'New Title' };

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(null);

      // Act and Assert
      await expect(courseService.updateCourseBySlug(slug, userId, updateData)).rejects.toThrow('Course not found');
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error when user does not own the course', async () => {
      // Arrange
      const userId = 'user-123';
      const courseOwnerId = 'different-user';
      const slug = 'test-course';
      const updateData = { title: 'New Title' };
      
      const mockCourse = {
        id: 1,
        title: 'Test Course',
        userId: courseOwnerId, // Different from the requesting user
      };

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(mockCourse);

      // Act and Assert
      await expect(courseService.updateCourseBySlug(slug, userId, updateData)).rejects.toThrow('Forbidden');
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCourseBySlug', () => {
    it('should delete a course successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const slug = 'test-course';
      
      const mockCourse = {
        id: 1,
        title: 'Test Course',
        userId,
      };

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(mockCourse);
      (courseRepository.deleteCourse as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await courseService.deleteCourseBySlug(slug, userId);

      // Assert
      expect(result).toEqual({ success: true, message: 'Course deleted successfully' });
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.deleteCourse).toHaveBeenCalledWith(mockCourse.id);
    });

    it('should throw an error when course is not found', async () => {
      // Arrange
      const userId = 'user-123';
      const slug = 'non-existent-course';

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(null);

      // Act and Assert
      await expect(courseService.deleteCourseBySlug(slug, userId)).rejects.toThrow('Course not found');
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.deleteCourse).not.toHaveBeenCalled();
    });

    it('should throw an error when user does not own the course', async () => {
      // Arrange
      const userId = 'user-123';
      const courseOwnerId = 'different-user';
      const slug = 'test-course';
      
      const mockCourse = {
        id: 1,
        title: 'Test Course',
        userId: courseOwnerId, // Different from the requesting user
      };

      // Setup mocks
      (courseRepository.findBySlug as jest.Mock).mockResolvedValue(mockCourse);

      // Act and Assert
      await expect(courseService.deleteCourseBySlug(slug, userId)).rejects.toThrow('Forbidden');
      expect(courseRepository.findBySlug).toHaveBeenCalledWith(slug);
      expect(courseRepository.deleteCourse).not.toHaveBeenCalled();
    });
  });

  describe('getCourseStatus', () => {
    it('should get course status correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const slug = 'test-course';
      
      const mockCourse = {
        isPublic: true,
        favorites: [{ userId, courseId: 1 }],
      };

      // Setup mocks
      (courseRepository.getCourseStatusForUser as jest.Mock).mockResolvedValue(mockCourse);

      // Act
      const result = await courseService.getCourseStatus(slug, userId);

      // Assert
      expect(result).toEqual({ isPublic: true, isFavorite: true });
      expect(courseRepository.getCourseStatusForUser).toHaveBeenCalledWith(slug, userId);
    });

    it('should throw an error when course is not found', async () => {
      // Arrange
      const userId = 'user-123';
      const slug = 'non-existent-course';

      // Setup mocks
      (courseRepository.getCourseStatusForUser as jest.Mock).mockResolvedValue(null);

      // Act and Assert
      await expect(courseService.getCourseStatus(slug, userId)).rejects.toThrow('Course not found');
      expect(courseRepository.getCourseStatusForUser).toHaveBeenCalledWith(slug, userId);
    });
  });
});
