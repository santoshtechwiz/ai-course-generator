
import CourseCreationVideo from "@/app/components/CourseCreationVideo";
import ConfirmChapters from "../../course/components/ConfirmChapters";
import { getAuthSession } from "@/lib/authOptions";
import { getCourses, prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import React from "react";

export const fetchCache = 'force-no-store';
type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const CreateChapters = async (props: Props) => {
  const params = await props.params;
  const slug = await params.slug;
  const session = await getAuthSession();

  if (!session?.user) {
    return redirect("/gallery");
  }


  const course=await getCourses(slug);

  if (!course) {
    return redirect("/create");
  }

  return (
    <>
      {/* Sidebar with fixed width and full height */}
   

      {/* Main content area */}
      <div className="flex flex-col flex-grow">
        {/* Header taking full width */}
      

        {/* Main content and RightSidebar aligned next to each other */}
        <div className="flex flex-grow">
          <div className="flex-grow p-4">
            <ConfirmChapters course={{ ...course, units: course.courseUnits }} />
          </div>
          {/* RightSidebar with fixed width */}
          <CourseCreationVideo />
        </div>
      </div>
    </>
  );
};

export default CreateChapters;
