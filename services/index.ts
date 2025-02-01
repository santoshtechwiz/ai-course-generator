import { getAuthSession } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { chatGptRequest } from "@/lib/chatgpt/chatGptRequest";
import { Course } from "@prisma/client";

// Define types for function returns
type FavoritesWithCourses = {
  id: string;
  course: Course;
};

type CourseOwnership = {
  isOwner: boolean;
  isPublic: boolean;
};

// Fetch user's favorite courses
const getUserFavorites = async (): Promise<FavoritesWithCourses[]> => {
  const session = await getAuthSession();
  if (!session) return [];

  try {
    const favoritesWithCourses = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { course: true },
    });
    return favoritesWithCourses;
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    return [];
  }
};

// Fetch remaining user credits
const getRemainingCredit = async (): Promise<number | null> => {
  const session = await getAuthSession();
  if (!session) return 0;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    return user?.credits ?? null;
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return null;
  }
};

// Check if the user is an admin
const isAdmin = async (): Promise<boolean> => {
  const session = await getAuthSession();
  return session?.user.email === "santosh.ksingh03@gmail.com";
};

// Increment view count for a specific course
const incrementCourseViewCount = async (courseId: number): Promise<boolean> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { viewCount: true },
    });

    if (!course) throw new Error("Course not found");

    await prisma.course.update({
      where: { id: courseId },
      data: { viewCount: course.viewCount + 1 },
    });
    return true;
  } catch (error) {
    console.error("Error incrementing course view count:", error);
    return false;
  }
};

// Get courses owned by a user with null video IDs in their chapters
const getCoursesWithNullVideoIdByUserId = async (
  userId: string
): Promise<Course[]> => {
  try {
    const coursesWithoutVideos = await prisma.course.findMany({
      where: {
        userId,
        courseUnits: {
          some: {
            chapters: {
              some: { videoId: null },
            },
          },
        },
      },
      include: { user: true },
    });
    return coursesWithoutVideos;
  } catch (error) {
    console.error("Error fetching courses with null video IDs:", error);
    return [];
  }
};

// Update view count for a course
const updateViewCount = async (courseId: number): Promise<Course | null> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { viewCount: true },
    });

    if (!course) throw new Error("Course not found");

    return await prisma.course.update({
      where: { id: courseId },
      data: { viewCount: course.viewCount + 1 },
    });
  } catch (error) {
    console.error("Error updating view count:", error);
    return null;
  }
};

// Update rating for a course
const updateRating = async (
  courseId: number,
  newRating: number
): Promise<Course | null> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { totalRatings: true, averageRating: true },
    });

    if (!course) throw new Error("Course not found");

    const newTotalRatings = course.totalRatings + 1;
    const newAverageRating =
      (course.totalRatings * course.averageRating + newRating) / newTotalRatings;

    return await prisma.course.update({
      where: { id: courseId },
      data: {
        totalRatings: newTotalRatings,
        averageRating: newAverageRating,
      },
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    return null;
  }
};

// Generate a summary of a transcript
const generateSummary = async (
  transcript: string
): Promise<{ summary: string }> => {
  const result = await chatGptRequest(
    "You are an AI capable of summarizing a YouTube transcript",
    "Summarize in 250 words or less without sponsors or unrelated topics.\n" + transcript,
    { summary: "summary of the transcript" }
  );
  return { summary: result.summary || "" };
};

// Update course privacy
const updateCoursePrivacy = async (
  courseId: string,
  userId: string,
  isPublic: boolean
): Promise<Course | null> => {
  try {
    return await prisma.course.update({
      where: {
        id: courseId,
        userId,
      },
      data: { isPublic },
    });
  } catch (error) {
    console.error("Error updating course privacy:", error);
    return null;
  }
};

// Check if a course is owned by a user
const isCourseOwnByUser = async (
  courseId: number,
  userId: string
): Promise<CourseOwnership> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true, isPublic: true },
    });

    if (!course) return { isOwner: false, isPublic: false };

    return {
      isOwner: course.userId === userId,
      isPublic: course.isPublic,
    };
  } catch (error) {
    console.error("Error checking course ownership:", error);
    return { isOwner: false, isPublic: false };
  }
};

// Get courses by category
const getCourseByCategory = async (name: string): Promise<Course[]> => {
  try {
    const category = await prisma.category.findUnique({
      where: { name },
      select: { id: true },
    });

    if (!category) return [];

    return await prisma.course.findMany({
      where: { categoryId: category.id },
    });
  } catch (error) {
    console.error("Error fetching courses by category:", error);
    return [];
  }
};

// Update user credits and user type
const updateUserCredits = async (
  id: string,
  credits: number,
  userType: UserType
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        credits: credits,
        userType,
      },
    });
  } catch (error) {
    console.error("Error updating user credits:", error);
  }
};

export {
  getUserFavorites,
  getRemainingCredit,
  isAdmin,
  incrementCourseViewCount,
  getCoursesWithNullVideoIdByUserId,
  updateViewCount,
  updateRating,
  generateSummary,
  updateCoursePrivacy,
  isCourseOwnByUser,
  getCourseByCategory,
  updateUserCredits,
};
