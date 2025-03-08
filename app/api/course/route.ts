import { NextResponse } from "next/server";
import { getUnsplashImage } from "@/lib/unsplash";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/authOptions";
import { generateCourseContent } from "@/lib/chatgpt/generateCourseContent";
import { createChaptersSchema } from "@/schema/schema";
import { generateSlug } from "@/lib/utils";
import NodeCache from 'node-cache';

// Cache instance with 30 minutes TTL
const courseCache = new NodeCache({ 
  stdTTL: 1800,
  checkperiod: 120
});

export const fetchCache = 'force-no-store';

async function validateUserCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  });

  if (!user || user.credits <= 0) {
    throw new Error("Insufficient credits");
  }

  return user;
}

async function createCategory(category: string) {
  const cacheKey = `category_${category}`;
  const cachedCategory = courseCache.get<number>(cacheKey);
  
  if (cachedCategory) {
    return cachedCategory;
  }

  const existingCategory = await prisma.category.findUnique({
    where: { name: category },
  });

  if (existingCategory) {
    courseCache.set(cacheKey, existingCategory.id);
    return existingCategory.id;
  }

  const createdCategory = await prisma.category.create({
    data: { name: category },
  });

  courseCache.set(cacheKey, createdCategory.id);
  return createdCategory.id;
}

async function generateUniqueSlug(title: string) {
  let slug = generateSlug(title);
  let counter = 1;
  
  while (true) {
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (!existingCourse) break;
    slug = generateSlug(title) + `-${counter++}`;
  }

  return slug;
}

type OutputUnits = {
  title: string;
  chapters: {
    youtube_search_query: string;
    chapter_title: string;
  }[];
}[];

const removeDuplicate = (data: OutputUnits): OutputUnits => {
  const uniqueData = [];
  const uniqueUnits = new Set();

  for (const item of data) {
    const unitIdentifier = item.title;
    if (!uniqueUnits.has(unitIdentifier)) {
      uniqueUnits.add(unitIdentifier);
      const uniqueItem = {
        ...item,
        chapters: item.chapters.reduce((accChapters, chapter) => {
          const normalizedQuery = chapter.youtube_search_query.trim().toLowerCase();
          const existingChapter = accChapters.find(
            (c) => c.youtube_search_query.trim().toLowerCase() === normalizedQuery
          );
          if (!existingChapter) {
            accChapters.push(chapter);
          }
          return accChapters;
        }, [] as typeof item['chapters'])
      };
      uniqueData.push(uniqueItem);
    }
  }

  return uniqueData;
};

async function createCourseWithUnits(
  courseData: {
    title: string;
    description: string;
    image: string;
    userId: string;
    categoryId: number;
    slug: string;
  },
  outputUnits: OutputUnits
) {
  const course = await prisma.course.create({
    data: {
      title: courseData.title,
      image: courseData.image,
      description: courseData.description,
      userId: courseData.userId,
      categoryId: courseData.categoryId,
      slug: courseData.slug,
      isPublic: false,
      
    },
  });

  const outputUnitsClone = removeDuplicate(outputUnits);

  for (const unit of outputUnitsClone) {
    const prismaUnit = await prisma.courseUnit.create({
      data: {
        name: unit.title,
        courseId: course.id,
      },
    });

    await prisma.chapter.createMany({
      data: unit.chapters.map((chapter) => ({
        name: chapter.chapter_title,
        title: chapter.chapter_title,
        youtubeSearchQuery: chapter.youtube_search_query,
        unitId: prismaUnit.id,
      })),
    });
  }

  return course;
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("unauthorised", { status: 401 });
    }

    // Validate user credits before starting expensive operations
    await validateUserCredits(session.user.id);

    const body = await req.json();
    const { title, units, category, description } = createChaptersSchema.parse(body);

    // Generate unique slug
    const slug = await generateUniqueSlug(title);

    // Generate course content
    const outputUnits = await generateCourseContent(title, units);
    
    // Get course image
    const courseImage = await getUnsplashImage(title);

    // Create or get category
    const categoryId = await createCategory(category);

    // Create course and its units
    const course = await createCourseWithUnits(
      {
        title,
        description,
        image: courseImage,
        userId: session.user.id,
        categoryId,
        slug,
      },
      outputUnits
    );

    // Only deduct credits after successful course creation
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 1 } },
    });

    // Cache the new course
    courseCache.set(`course_${course.id}`, course);

    return NextResponse.json({ slug: course.slug });
  } catch (error: any) {
    console.error(`Course creation error: ${error.message}`);
    
    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    return new NextResponse(
      "An unexpected error occurred. Please try again later.",
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("unauthorised", { status: 401 });
    }

    const url = new URL(req.url);
    const courseId = parseInt(url.searchParams.get('courseId') || '0', 10);

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Check cache first
    const cacheKey = `course_${courseId}`;
    const cachedCourse = courseCache.get(cacheKey);
    
    if (cachedCourse) {
      return NextResponse.json(cachedCourse);
    }

    // If not in cache, fetch from database
    const course = await prisma.course.findMany({
      where: { id: courseId },
      include: {
        courseUnits: {
          include: {
            chapters: true,
          },
        },
      },
    });

    if (!course.length) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Cache the result
    courseCache.set(cacheKey, course);

    return NextResponse.json(course);
  } catch (error: any) {
    console.error(`Course retrieval error: ${error.message}`);
    return new NextResponse(
      "An unexpected error occurred. Please try again later.",
      { status: 500 }
    );
  }
}

