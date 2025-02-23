
import { getAuthSession } from "@/lib/authOptions";

import { redirect } from "next/navigation";
import React from "react";
import { getCourses } from "@/app/actions/getCourses";
import ConfirmChapters from "@/components/features/course/ConfirmChapters";
import CourseCreationVideo from "@/components/landing/CourseCreationVideo";

export const fetchCache = "force-no-store";
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

  const course = await getCourses(slug);

  if (!course) {
    return redirect("/create");
  }

  return (
    <div className="flex flex-col min-h-screen bg-shadcn-primary-50">
      <div className="flex flex-col flex-grow p-4 md:flex-row md:space-x-4">
        <div className="w-full md:w-2/3 bg-shadcn-white rounded-lg shadow-md p-4 mb-4 md:mb-0">
          <ConfirmChapters
            course={{ ...course, units: course.courseUnits }}
          />
        </div>
        <div className="w-full md:w-1/3">
          <CourseCreationVideo />
        </div>
      </div>
    </div>
  );
};

export default CreateChapters;
