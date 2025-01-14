"use client";

import React from "react";
import { motion } from "framer-motion";
import { Book, Clock, Users, ChevronRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Link from "next/link";
import { CourseDetails } from "@/app/types";

interface RandomCoursesProps {
  courseDetails: CourseDetails[];
}

const PopularCourses: React.FC<RandomCoursesProps> = ({ courseDetails }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-96 p-4 space-y-4 bg-background border-l h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <div className="sticky top-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-semibold">Popular Courses</h2>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {courseDetails.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{course.courseName}</span>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center"
                    >
                      <Book className="h-4 w-4 text-rose-500" />
                    </motion.div>
                  </CardTitle>
                  <CardDescription>
                    {`Learn about ${course.category || "various topics"}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {/* {Math.floor(Math.random() * 1000) + 500} students */}
                      {course.totalChapters} chapters
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {`${course.totalUnits} units`}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/dashboard/course/${course.slug}`}>
                    <Button className="w-full group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      View Course
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default PopularCourses;
