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
            chapters: true, // Ensure the chapter relationship is included
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