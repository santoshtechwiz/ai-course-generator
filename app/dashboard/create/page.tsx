import RandomQuote from "@/components/RandomQuote";
import { BookOpen, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { getCourseDetails } from "@/app/actions/getCourseDetails";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { QueryParams } from "@/app/types/types";
import PopularCourses from "@/app/dashboard/course/components/PopularCourses";
import { QuizCourseWrapper } from "../(quiz)/components/QuizCourseWrapper";
import { generateSeoMetadata } from "@/lib/utils/seo-utils";
import NavigationDebugger from "@/components/debug/NavigationDebugger";

export const dynamic = "force-dynamic";

export const metadata = generateSeoMetadata({
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
    <div className="container mx-auto py-6 min-h-screen bg-background text-foreground space-y-8">
      {process.env.NODE_ENV === 'development' && <NavigationDebugger />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <RandomQuote />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
              <h2 className="text-2xl font-semibold flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-primary" />
                Create Your Course
              </h2>
              <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                Pro tip: Be specific with your topic
              </div>
            </div>
            <QuizCourseWrapper
              type="course"
              queryParams={{
                title,
                category,
                difficulty: difficulty as any,
              }}
            />
          </Card>
        </div>

        {/* Right Section */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Popular Courses
              </h3>
            </div>

            <PopularCourses courseDetails={courseData}  />

            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Ready to share your knowledge?</h4>
                  <p className="text-sm text-muted-foreground">
                    Create your first course today!
                  </p>
                </div>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/dashboard/explore">
                  <span>Browse More Courses</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;