import CreateCourseForm from "./components/CreateCourseForm";
import PopularCourses from "./components/PopularCourses";
import { getCourseDetails } from "@/lib/db";

export const fetchCache = "force-no-store";

const Page = async ({ searchParams }: { searchParams:Promise< { topic?: string }> }) => {
  const topic = (await searchParams)?.topic || "";
 
  const courseData = await getCourseDetails();

  return (
    <div className="flex flex-col md:flex-row w-full gap-6 p-4 bg-gray-50 text-gray-900">
      {/* Left Section */}
      <div className="w-full md:flex-[3] p-4 bg-white rounded-lg shadow-md">
        <CreateCourseForm  topic={topic}/>
      </div>
  
      {/* Right Section */}
      <div className="w-full md:flex-[1] p-4 bg-white rounded-lg shadow-md">
        <PopularCourses courseDetails={courseData} />
      </div>
    </div>
  );
  
};

export default Page;
