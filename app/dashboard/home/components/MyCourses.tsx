"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Course } from "@/app/types/types"
import { Skeleton } from "@/components/ui/skeleton"
import { getImageWithFallback } from '@/utils/image-utils'

interface MyCoursesProps {
  courses: Course[]
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden rounded-none">
        <CardHeader className="border-b-3 border-border bg-muted/50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-black">My Courses</CardTitle>
            {courses.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="rounded-none border-2 font-bold">
                <Link href="/dashboard/courses" className="text-sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length > 0 ? (
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <AnimatePresence>
                <div className="divide-y">
                  {courses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/dashboard/course/${course.slug}`} className="group block">
                        <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 transition-colors hover:bg-primary/10 border-b-2 border-border last:border-b-0">
                          <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-none border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                            <Image
                              src={getImageWithFallback(course.image)}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm sm:text-base font-bold truncate">{course.title}</h3>
                              <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary font-black" />
                              </motion.div>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 font-semibold">
                              {course.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 sm:py-12 border-4 border-dashed border-border/50 m-4 rounded-none">
              <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base sm:text-lg font-black">No courses yet</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-bold">
                Start your journey by creating your first course.
              </p>
              <Button asChild className="mt-4 sm:mt-6 rounded-none border-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                <Link href="/dashboard/explore" className="gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Create Course
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function MyCoursesLoading() {
  return (
    <Card className="rounded-none">
      <CardHeader className="border-b-3 border-border p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-black">My Courses</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y-2 divide-border">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 sm:p-4 flex items-center space-x-3 sm:space-x-4">
              <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-none border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[150px] sm:w-[200px] rounded-none" />
                <Skeleton className="h-3 sm:h-4 w-[120px] sm:w-[160px] rounded-none" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
