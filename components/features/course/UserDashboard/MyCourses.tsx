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

interface MyCoursesProps {
  courses: Course[]
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">My Courses</CardTitle>
            {courses.length > 0 && (
              <Button asChild variant="ghost" size="sm">
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
                        <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 transition-colors hover:bg-muted">
                          <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={course.image || "/placeholder.svg"}
                              alt={course.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm sm:text-base font-medium truncate">{course.name}</h3>
                              <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              </motion.div>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
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
            <div className="text-center py-8 sm:py-12">
              <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-base sm:text-lg font-medium">No courses yet</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Start your journey by creating your first course.
              </p>
              <Button asChild className="mt-4 sm:mt-6">
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
    <Card>
      <CardHeader className="border-b p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">My Courses</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 sm:p-4 flex items-center space-x-3 sm:space-x-4">
              <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[150px] sm:w-[200px]" />
                <Skeleton className="h-3 sm:h-4 w-[120px] sm:w-[160px]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

