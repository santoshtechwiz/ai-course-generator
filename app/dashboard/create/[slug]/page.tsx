
import { authOptions, getAuthSession } from "@/lib/authOptions";

import { notFound, redirect } from "next/navigation";
import React from "react";
import { getCourses } from "@/app/actions/getCourses";
import ConfirmChapters from "@/components/features/course/ConfirmChapters";
import CourseCreationVideo from "@/components/landing/CourseCreationVideo";
import { getCourseData } from "@/app/actions/getCourseData";
import { getServerSession } from "next-auth";
import { generatePageMetadata } from "@/lib/seo-utils";
import { Metadata } from "next";

export const fetchCache = "force-no-store";
type Props = {
  params: Promise<{
    slug: string;
  }>;
};
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourseData(params.slug)

  if (!course) {
    return {
      title: "Course Creation | CourseAI",
      description: "Create your own interactive programming course with our AI-powered tools.",
    }
  }

  return generatePageMetadata({
    title: `Creating: ${course.name} | Course AI`,
    description: `Design and build your ${course.name.toLowerCase()} course with our intuitive course creation tools. Share your expertise and engage learners effectively.`,
    path: `/dashboard/create/${params.slug}`,
    keywords: [
      `${course.name.toLowerCase()} course creation`,
      "build online course",
      "teaching platform",
      "educational content",
      "course design",
      "AI course builder",
    ],
    ogType: "website",
  })
}

const CourseCreationPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const course = await getCourseData(slug)
  if (!course) {
    notFound()
  }

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `Creating: ${course.name}`,
    description: `Design and build your ${course.name} course with our intuitive course creation tools.`,
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/create/${slug}`,
  }

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Create", url: `${baseUrl}/dashboard/create` },
    { name: course.name, url: `${baseUrl}/dashboard/create/${slug}` },
  ]

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
