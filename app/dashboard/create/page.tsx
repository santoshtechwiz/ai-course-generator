import { QuizWrapper } from "@/components/QuizWrapper";
import PopularCourses from "./components/PopularCourses";
import RandomQuote from "@/components/RandomQuote";

import { Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { getCourseDetails } from "@/app/actions/getCourseDetails";

const Page = async ({ searchParams }: { searchParams: Promise<{ topic?: string }> }) => {
  const topic = (await searchParams)?.topic || "";
  const courseData = await getCourseDetails();

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto mb-8">
        <RandomQuote />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/5">
          <Sparkles className="h-8 w-8" />
          Generate AI Course
          <Sparkles className="h-8 w-8" />
        </h1>
        <p className="mt-2 text-muted-foreground">Create personalized AI-powered courses in minutes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 border border-border/50">
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
            <QuizWrapper type={"course"} />
          </div>
        </div>

        {/* Right Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-border/50">
            <div className="p-4 md:p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-foreground">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                Explore Courses
              </h2>
              <PopularCourses courseDetails={courseData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
