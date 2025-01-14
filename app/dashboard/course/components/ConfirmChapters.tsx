"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import ChapterCard, { ChapterCardHandler } from "./ChapterCardHandler";

import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Course, CourseUnit, Chapter} from "@prisma/client";

export type CourseProps = {
  course: Course & {
    units: (CourseUnit & {
      chapters: Chapter[];
    })[];
  };
};
const ConfirmChapters = ({ course }: CourseProps) => {
  console.log(JSON.stringify(course));
  const [loading, setLoading] = React.useState(false);
  const chapterRefs: Record<string, React.RefObject<ChapterCardHandler>> = {};
  course.units.forEach((unit) => {
    unit.chapters.forEach((chapter) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      chapterRefs[chapter.id] = React.useRef(null);
    });
  });
  const [completedChapters, setCompletedChapters] = React.useState<Set<number>>(
    new Set()
  );
  const totalChaptersCount = React.useMemo(() => {
    return course.units.reduce((acc, unit) => {
      return acc + unit.chapters.length;
    }, 0);
  }, [course.units]);

  const progress = (completedChapters.size / totalChaptersCount) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          {course.name}
        </CardTitle>
        <div className="mt-2 space-y-1">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {completedChapters.size} of {totalChaptersCount} chapters completed
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          {course.units.map((unit, unitIndex) => (
            <div key={unit.id} className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Unit {unitIndex + 1}
              </h2>
              <h3 className="text-xl font-bold mb-3">{unit.name}</h3>
              <div className="space-y-3">
                {unit.chapters.map((chapter, chapterIndex) => (
                  <ChapterCard
                    onComplete={completedChapters}
                    setCompletedChapters={setCompletedChapters}
                    ref={chapterRefs[chapter.id]}
                    key={chapter.id}
                    chapter={chapter}
                    chapterIndex={chapterIndex}
                  />
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex items-center justify-between mt-6">
          <Link
            href="/dashboard/create"
            className={buttonVariants({
              variant: "outline",
            })}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          {totalChaptersCount === completedChapters.size ? (
            <Link
              className={buttonVariants({
                className: "font-semibold",
              })}
              href={`/dashboard/course/${course.slug}`}
            >
              Save & Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          ) : (
            <Button
              type="button"
              className="font-semibold"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                Object.values(chapterRefs).forEach((ref) => {
                  ref.current?.triggerLoad();
                });
              }}
            >
              {loading ? "Generating..." : "Generate"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmChapters;