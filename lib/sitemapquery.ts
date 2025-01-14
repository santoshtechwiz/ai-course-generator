import { prisma } from "./db";

// 1. Get all courses
export const getCourses = async () => {
    try {
        const courses = await prisma.course.findMany();
        return courses;
    } catch (error) {
        console.error("Error fetching courses:", error);
    }
};


// 2. Get a specific course by ID
export const getCourse = async (id: string) => {
    try {
        const course = await prisma.course.findUnique({
            where: {
                id: Number(id), // Convert string to number
            },
        });
        return course;
    } catch (error) {
        console.error(`Error fetching course with id ${id}:`, error);
    }
};

// 3. Add a new course
export const addCourse = async (course: {
    name: string;
    description: string;
    image: string;
    userId: string;
    categoryId?: number;
}) => {
    try {
        const newCourse = await prisma.course.create({
            data: {
                name: course.name,
                description: course.description,
                image: course.image,
                userId: course.userId,
                categoryId: course.categoryId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return newCourse;
    } catch (error) {
        console.error("Error adding course:", error);
    }
};

// 4. Delete a course by ID
export const deleteCourse = async (id: string) => {
    try {
        const deletedCourse = await prisma.course.delete({
            where: {
                id: Number(id), // Convert string to number
            },
        });
        return deletedCourse;
    } catch (error) {
        console.error(`Error deleting course with id ${id}:`, error);
    }
};

// 5. Update a course by ID
export const updateCourse = async (id: string, updates: Partial<{ name: string; description: string; image: string; categoryId?: number }>) => {
    try {
        const updatedCourse = await prisma.course.update({
            where: {
                id: Number(id), // Convert string to number
            },
            data: updates,
        });
        return updatedCourse;
    } catch (error) {
        console.error(`Error updating course with id ${id}:`, error);
    }
};
