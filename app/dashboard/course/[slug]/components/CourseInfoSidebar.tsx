"use client"

import React from 'react'
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Calendar,
  Award,
  Target,
  BookOpen,
  Users
} from "lucide-react"

interface CourseInfoSidebarProps {
  title: string
  description?: string | null
  level?: string | null
  lastUpdated?: string | null
  duration?: {
    hours: number
    minutes: number
  } | null
  totalChapters: number
  certificateAvailable: boolean
  category?: {
    name: string
  } | null
  students?: number
  instructor?: {
    name: string
    title?: string
    image?: string
  }
}

export function CourseInfoSidebar({
  title,
  description,
  level,
  lastUpdated,
  duration,
  totalChapters,
  certificateAvailable,
  category,
  students,
  instructor
}: CourseInfoSidebarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:block w-full"
    >
      <Card className="sticky top-24 w-full shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {description && (
            <div className="text-muted-foreground line-clamp-3">{description}</div>
          )}

          <Separator />

          {/* Course meta info */}
          <div className="space-y-3">
            {level && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <Target className="h-4 w-4 mr-2" />
                  <span>Level</span>
                </div>
                <Badge variant="secondary">{level}</Badge>
              </div>
            )}

            {duration && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Duration</span>
                </div>
                <span>{duration.hours}h {duration.minutes}m</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center text-muted-foreground">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>Chapters</span>
              </div>
              <span>{totalChapters}</span>
            </div>

            {students && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Students</span>
                </div>
                <span>{students.toLocaleString()}</span>
              </div>
            )}

            {lastUpdated && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Last updated</span>
                </div>
                <span>{lastUpdated}</span>
              </div>
            )}

            {certificateAvailable && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <Award className="h-4 w-4 mr-2" />
                  <span>Certificate</span>
                </div>
                <span>Available</span>
              </div>
            )}
          </div>

          {instructor && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-muted-foreground">Instructor</p>
                <div className="flex items-center">
                  {instructor.image ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted mr-3">
                      <img 
                        src={instructor.image} 
                        alt={instructor.name} 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-primary font-medium text-lg">
                        {instructor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{instructor.name}</p>
                    {instructor.title && (
                      <p className="text-xs text-muted-foreground">{instructor.title}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
