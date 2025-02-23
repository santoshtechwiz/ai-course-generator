"use client";

import React, { useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/hooks/use-toast";
import { CourseCard } from "./CourseCard";
import { SkeletonCard } from "./SkeletonCard";
import { CategoryId } from "@/config/categories";
import { CreateCard } from "@/components/CreateCard";

interface CoursesClientProps {
  url: string;
  userId?: string;
  searchQuery: string;
  selectedCategory: CategoryId | null;
}

const ITEMS_PER_PAGE = 20;

const fetchCourses = async ({
  pageParam = 1,
  search,
  category,
  userId,
}: {
  pageParam?: number;
  search?: string;
  category?: CategoryId;
  userId?: string;
}) => {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    ...(search && { search }),
    ...(category && { category }),
    ...(userId && { userId }),
  });

  const res = await fetch(`/api/courses?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
};

const CoursesClient: React.FC<CoursesClientProps> = ({ url, userId, searchQuery, selectedCategory }) => {
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } = useInfiniteQuery({
    queryKey: ["courses", { search: debouncedSearchQuery, category: selectedCategory, userId }],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      fetchCourses({
        pageParam,
        search: debouncedSearchQuery,
        category: selectedCategory || undefined,
        userId,
      }),
    getNextPageParam: (lastPage, pages) => {
      const totalFetched = pages.reduce((total, page) => total + page.courses.length, 0);
      return totalFetched < lastPage.totalCount ? pages.length + 1 : undefined;
    },
  });

  useEffect(() => {
    refetch();
  }, [refetch, debouncedSearchQuery, selectedCategory]);

  const courses = data?.pages.flatMap((page) => page.courses) || [];

  if (status === "error") {
    toast({
      title: "Error",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return (
    <div className="flex-1 p-6">
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </motion.div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <p className="text-xl text-muted-foreground mb-4">
              {searchQuery || selectedCategory ? "No courses found matching your criteria." : "No courses available."}
            </p>
            <CreateCard
              title="Create New Course"
              description="Can't find what you're looking for? Create a new course!"
              createUrl={url}
              animationDuration={2.0}
            />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  xl:grid-cols-3 gap-4 sm:gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(CoursesClient);