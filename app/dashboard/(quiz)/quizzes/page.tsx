import { Suspense } from "react";
import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";

import { getQuizzes, QuizListItem } from "@/app/actions/getQuizes";
import { JsonLD, generateMetadata } from "@/lib/seo-manager-new";
// Import components directly to avoid any issues with the barrel file
import { QuizzesClient } from "./components/QuizzesClient";

import ClientOnly from "@/components/ClientOnly";
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { BookIcon } from "lucide-react";

export const metadata: Metadata = generateMetadata({
  title: "Free Quizzes – MCQs, Open-ended and Code Challenges",
  description:
    "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
  path: "/dashboard/quizzes",
  keywords: [
    "programming quizzes",
    "coding tests",
    "developer assessments",
    "interactive quizzes",
    "tech knowledge tests",
    "coding challenges",
    "programming practice",
    "code exercises",
    "developer quiz",
    "learning assessment",
  ],
  ogType: "website",
});

export const dynamic = "force-dynamic";

const Page = async () => {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  const quizzesData = await getQuizzes({
    page: 1,
    limit: 5,
    searchTerm: "",
    userId: userId,
    quizTypes: [],
  });

  // Transform the data to match the expected interface
  const initialQuizzesData = {
    quizzes: quizzesData.quizzes as QuizListItem[],
    nextCursor: quizzesData.nextCursor,
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Explore Quizzes"
        description="Discover interactive quizzes designed to enhance your learning experience and test your knowledge."
        icon={BookIcon}
      />
      <JsonLD
        type="default"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Explore Quizzes",
          description:
            "Discover interactive quizzes to test and enhance your programming knowledge and skills.",
          url: "https://courseai.io/dashboard/quizzes",
        }}
      />

      <Suspense
        fallback={<SuspenseGlobalFallback message="Loading Courses..." />}
      >
        <ClientOnly>
          <QuizzesClient
            initialQuizzesData={initialQuizzesData}
            userId={userId}
          />
        </ClientOnly>
      </Suspense>
    </PageWrapper>
  );
};

export default Page;
