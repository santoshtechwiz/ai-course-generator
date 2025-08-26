import RandomQuote from "@/components/RandomQuote";
import { BookOpen, Lightbulb, TrendingUp, ArrowRight, Sparkles, Target, Users, Clock } from "lucide-react";
import { getCourseDetails } from "@/app/actions/getCourseDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { QueryParams } from "@/app/types/types";
import PopularCourses from "@/app/dashboard/course/components/PopularCourses";
import { QuizCourseWrapper } from "../(quiz)/components/QuizCourseWrapper";

import NavigationDebugger from "@/components/debug/NavigationDebugger";
import { JsonLD } from "@/lib/seo";
import { generateMetadata } from "@/lib/seo";


// Removed force-dynamic to allow static optimization / caching where possible

export const metadata = generateMetadata({
  title: "Create Free Video Course Using AI",
  description:
    "Design and build your own interactive course with our intuitive course creation tools. Share your expertise and engage learners effectively.",
  keywords: [
    "course creation",
    "build online course", 
    "teaching platform",
    "educational content",
    "course design",
    "AI course builder",
    "video course creator",
  ],
  type: "website",
  image: "/og-image-create-course.jpg",
});

const Page = async ({
  params,
  searchParams: searchParamsPromise,
}: {
  params: QueryParams;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  let title = "";
  let category = "";
  let difficulty = "";
  let courseData = [];

  try {
    const searchParams = await searchParamsPromise;

    title = Array.isArray(params?.title)
      ? params.title[0]
      : params?.title || "";

    category =
      typeof params?.categoryAttachment === "string"
        ? params.categoryAttachment
        : Array.isArray(searchParams?.category)
        ? searchParams.category[0]
        : searchParams?.category || "";

    difficulty = Array.isArray(searchParams?.difficulty)
      ? searchParams.difficulty[0]
      : typeof searchParams?.difficulty === "string"
      ? searchParams.difficulty
      : "";

    courseData = await getCourseDetails();
    console.log("Fetched course data:", courseData);
  } catch (error) {
    console.warn("Failed to fetch course details:", error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io";

  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Course Creation Tool",
    description:
      "Design and build your own interactive course with our intuitive course creation tools.",
    creator: { "@type": "Organization", name: "Course AI" },
    url: `${baseUrl}/dashboard/explore`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dashboard",
        item: `${baseUrl}/dashboard`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Create Course",
        item: `${baseUrl}/dashboard/explore`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-6 space-y-6">
        {process.env.NODE_ENV === 'development' && <NavigationDebugger />}
        <JsonLD type="CreativeWork" data={creativeWorkSchema} />
        <JsonLD type="BreadcrumbList" data={breadcrumbSchema} />

        {/* Compact Random Quote */}
        <RandomQuote />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Left Section - Course Creation Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="relative overflow-hidden border-primary/20 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-20 translate-x-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/5 to-transparent rounded-full translate-y-16 -translate-x-16" />
              
              <CardHeader className="relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground">
                          Create Your Course
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Transform your knowledge into engaging content
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Powered
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
                      <Lightbulb className="h-3 w-3 mr-1.5 text-yellow-500" />
                      Be specific with your topic
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative">
                {/* Enhanced form wrapper with visual feedback */}
                <div className="relative">
                  {/* Form background with subtle pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-lg" />
                  
                  {/* Form container with enhanced styling */}
                  <div className="relative bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 shadow-sm">
                    <QuizCourseWrapper
                      type="course"
                      queryParams={{
                        title,
                        category,
                        difficulty: difficulty as any,
                      }}
                    />
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Smart Structure</p>
                      <p className="text-xs text-muted-foreground">AI-generated course outline</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Quick Setup</p>
                      <p className="text-xs text-muted-foreground">Ready in minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Engage Learners</p>
                      <p className="text-xs text-muted-foreground">Interactive content</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Right Section - Popular Courses */}
          <div className="space-y-6">
            <Card className="relative overflow-hidden border-border/50 shadow-lg bg-gradient-to-br from-card to-muted/20">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-12 translate-x-12" />
              
              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Popular Courses</CardTitle>
                      <p className="text-xs text-muted-foreground">Trending in the community</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <PopularCourses courseDetails={courseData} />

                {/* Enhanced CTA Section */}
                <div className="border-t border-border/30 pt-4 mt-6">
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-4">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -translate-y-8 translate-x-8" />
                    
                    <div className="relative flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/20 border border-primary/30">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          Ready to share your knowledge?
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Join thousands of creators building amazing courses
                        </p>
                        <Button className="w-full group" asChild>
                          <Link href="/dashboard/explore">
                            <Sparkles className="mr-2 h-3 w-3" />
                            <span>Browse More Courses</span>
                            <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold text-primary">1,200+</div>
                    <div className="text-xs text-muted-foreground">Active Courses</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold text-primary">50k+</div>
                    <div className="text-xs text-muted-foreground">Happy Learners</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

