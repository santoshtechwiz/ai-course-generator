import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, Users, FileQuestion, Star, Eye } from "lucide-react";
import type { CourseCardProps } from "@/app/types/types";
import React from "react";

export const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({ name, description, image, rating, slug, unitCount, lessonCount, quizCount, viewCount }) => {
    return (
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg w-full sm:max-w-md">
        <div className="relative w-full pt-[56.25%]">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 hover:scale-105"
          />
        </div>
        <CardContent className="flex-grow flex flex-col p-6">
          <h3 className="text-xl font-semibold mb-2 line-clamp-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{description}</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Book className="w-4 h-4 mr-2" /> {unitCount} Units
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-2" /> {lessonCount} Lessons
            </span>
            <span className="flex items-center">
              <FileQuestion className="w-4 h-4 mr-2" /> {quizCount} Quizzes
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-2" /> {viewCount} Views
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0 flex justify-between items-center">
          <Badge variant="secondary" className="px-2 py-1">
            <Star className="w-4 h-4 mr-1 inline-block text-yellow-500" />
            <span className="font-medium">{rating?.toFixed(1)}</span>
          </Badge>
          <Link href={`/dashboard/course/${slug}`} className="w-auto">
            <Button variant="outline" size="sm">
              View Course
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
);

CourseCard.displayName = "CourseCard";