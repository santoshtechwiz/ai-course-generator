'use server'
import prisma from "@/lib/db";

// Fetch course details
export async function getCourseDetails(): Promise<any[]> {
  const courses = await prisma.course.findMany({
    orderBy: { id: "asc" },
    where: { isPublic: true },
    select: {
      id: true,
      slug: true,
      title: true,
      category: { select: { name: true } },
      courseUnits: {
        select: {
          chapters: {
            select: { id: true },
          },
        },
      },
    },
    take: 5,
  });

  // Map through courses to structure the result
  return courses.map((course) => {
    const totalUnits = (course.courseUnits || []).length;
    const totalChapters = (course.courseUnits || []).reduce(
      (sum: number, section: { chapters: { id: number }[] }) => sum + section.chapters.length,
      0
    );

    return {
      id: course.id,
      courseName: course.title,
      totalUnits,
      totalChapters,
      category: course.category?.name || null,
      slug: course.slug || "",
    };
  });
}