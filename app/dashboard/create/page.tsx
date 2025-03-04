
import { QuizWrapper } from "@/components/QuizWrapper";

import RandomQuote from "@/components/RandomQuote";
import { BookOpen, Lightbulb } from 'lucide-react';
import { getCourseDetails } from "@/app/actions/getCourseDetails";
import { Card } from "@/components/ui/card";
import { QueryParams } from "@/app/types/types";
import PopularCourses from "@/components/features/create/PopularCourses";
export const metadata = {
  title: "Create Your Course | Course AI",
  description:
    "Design and build your own interactive course with our intuitive course creation tools. Share your expertise and engage learners effectively.",
}
const Page = async ({
  params,
  searchParams
}: {
  params: QueryParams,
  searchParams: { [key: string]: string | string[] | undefined }
}) => {

  let topic = "";
  let category = "";
  let courseData = [];

  try {
    topic = typeof params?.topic === 'string' ? params.topic : (Array.isArray(searchParams?.topic) ? searchParams.topic[0] : searchParams?.topic) || "";
    category = typeof params?.categoryAttachment === 'string' ? params.categoryAttachment : (Array.isArray(searchParams?.category) ? searchParams.category[0] : searchParams?.category) || "";
    courseData = await getCourseDetails();
  } catch (error) {
    console.warn("Failed to fetch course details:", error);
  }

  return (
    <div className="container mx-auto py-6 space-y-6 min-h-screen bg-background text-foreground">
      {/* RandomQuote Section */}
      <RandomQuote />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Create Your Course */}
        <div className="lg:col-span-2">
          <Card className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
            <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center text-foreground">
                  <BookOpen className="mr-2 h-6 w-6 text-primary" />
                  Create Your Course
                </h2>
                <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                  <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                  Pro tip: Be specific with your topic
                </div>
              </div>
              <QuizWrapper
                type="course"
                queryParams={{
                  topic: topic,
                  category: category
                }}
              />
            </div>
          </Card>
        </div>

        {/* Right Section - Explore Courses */}
        <div className="lg:col-span-1">
          <Card className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
            <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
              <PopularCourses courseDetails={courseData} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;