"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { CourseCard } from "./CourseCard";
import { CreateCard } from "@/app/components/CreateCard";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/useDebounce";

interface Course {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  slug: string;
  unitCount: number;
  lessonCount: number;
  quizCount: number;
  userId: string;
}

interface CourseListProps {
  initialCourses: Course[];
  url: string;
}

const CourseList = ({ initialCourses, url }: CourseListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const filteredCourses = useMemo(() => {
    const lowercaseQuery = debouncedSearchQuery.toLowerCase();
    return initialCourses.filter(
      (course) =>
        course.name.toLowerCase().includes(lowercaseQuery) ||
        (course.description?.toLowerCase() || "").includes(lowercaseQuery)
    );
  }, [initialCourses, debouncedSearchQuery]);

  const isSearching = debouncedSearchQuery.length > 0;

  useEffect(() => {
    if (inView) {
      setShowCreatePrompt(true);
    }
  }, [inView]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  if (!initialCourses || initialCourses.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">No courses available.</p>
        <CreateCard
          title="Create Your First Course"
          description="Start your teaching journey by creating your first course!"
          createUrl={url}
          animationDuration={2.0}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative min-h-screen">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-2 border-b">
        <div className="flex items-center max-w-7xl mx-auto px-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <AnimatePresence mode="wait">
        {filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 px-4"
          >
            <p className="text-xl text-muted-foreground mb-4">
              {isSearching ? "No courses found matching your search." : "No courses available."}
            </p>
            <CreateCard
              title={isSearching ? "Create New Course" : "Add Your First Course"}
              description={
                isSearching
                  ? "Can't find what you're looking for? Create a new course!"
                  : "Start your teaching journey by creating your first course!"
              }
              createUrl={url}
              animationDuration={2.0}
            />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-4">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CourseCard {...course} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intersection Observer Target */}
      <div ref={ref} className="h-20" />

      {/* Floating Create Button */}
      <AnimatePresence>
        {showCreatePrompt && filteredCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-20"
          >
            <CreateCard
              floating
              title="Create Course"
              createUrl={url}
              animationDuration={2.0}
              className="w-auto"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseList;
