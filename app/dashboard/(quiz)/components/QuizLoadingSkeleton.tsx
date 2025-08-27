"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function QuizLoadingSkeleton() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-4 pb-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Quiz Progress */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Question Card */}
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </div>
          
          {/* Answer Options */}
          <div className="grid gap-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
