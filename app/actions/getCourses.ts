import { prisma } from "@/lib/db";

// Get all courses
export const getCourses = async (slug: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: {
        slug: slug, // Querying by slug instead of id
      },
      include: {
        courseUnits: {
          include: {
            chapters: true,
          },
        },
      },
    });
    return course;
  } catch (error) {
    console.error("Error fetching courses:", error);

  }
  return null;
};

export const getAllCourses = async () => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        courseUnits: {
          include: {
            chapters: true,
          },
        },
      },
    });
    return courses;
  } catch (error) {
    console.error("Error fetching all courses:", error);
  }
  return null;
}