"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Course {
  id: number
  courseName: string
  totalUnits: number
  totalChapters: number
  category: string
  slug: string
}

interface Props {
  courseDetails: Course[]
}

const categoryColors: Record<string, string> = {
  "cloud-computing": "bg-blue-100 text-blue-800",
  "web-development": "bg-green-100 text-green-800",
  "data-science": "bg-purple-100 text-purple-800",
}

const svgBackgrounds: Record<string, string> = {
  "cloud-computing": "/svg/cloud-bg.svg",
  "web-development": "/svg/web-bg.svg",
  "data-science": "/svg/data-bg.svg",
}

export default function PopularCourseSpotlight({ courseDetails }: Props) {
  const sortedCourses = useMemo(() => {
    return [...courseDetails].slice(0, 5)
  }, [courseDetails])

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % sortedCourses.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [sortedCourses.length])

  const currentCourse = sortedCourses[index]
  const category = currentCourse?.category?.toLowerCase()
  const badgeColor = categoryColors[category] || "bg-muted text-foreground"
  const backgroundSvg = svgBackgrounds[category]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
       
        <Link
          href="/dashboard/explore"
          className="text-sm text-primary/80 hover:text-primary transition-colors flex items-center group"
        >
          <span>View all</span>
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="relative h-[180px] sm:h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCourse?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Link href={`/dashboard/course/${currentCourse.slug}`} className="block h-full">
              <Card className="relative overflow-hidden h-full group border-muted/50 hover:border-primary/30 transition-all">
                {/* SVG Background */}
                {backgroundSvg && (
                  <div className="absolute inset-0 z-0 opacity-10">
                    <Image
                      src={backgroundSvg}
                      alt=""
                      fill
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                )}

                <CardContent className="relative z-10 p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {currentCourse.courseName}
                    </h3>
                    <Badge className={cn("text-xs", badgeColor)}>
                      {currentCourse.category.replace("-", " ")}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground mt-2">
                    {currentCourse.totalUnits} Unit{currentCourse.totalUnits > 1 ? "s" : ""} •{" "}
                    {currentCourse.totalChapters} Chapter{currentCourse.totalChapters > 1 ? "s" : ""}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
