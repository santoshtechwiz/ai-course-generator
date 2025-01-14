import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserProfile from "./components/UserProfile";
import QuizHistory from "./components/QuizHistory";
import { getAuthSession } from "@/lib/authOptions";
import SubscriptionStatus from "./course/components/UserDashboard/SubscriptionStatus";
import FavoriteCourses from "./components/FavoriteCourses";
import UserNotFound from "@/components/UserNotFound";
import { getUserData, getUserStats } from "../actions/userDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import AIRecommendations from "./components/Recommendations";
import CourseProgress from "./course/components/CoursePage/CourseProgress";
import { MyCourses } from "./course/components/UserDashboard/MyCourses";
import { MyQuizzes } from "./course/components/UserDashboard/MyQuizzes";

function LoadingCard() {
  return (
    <Card className="p-4">
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/dashboard/courses");
  }

  const userData = await getUserData(session.user.id);
  const userStats = await getUserStats(session.user.id);
  
  if (!userData) {
    return <UserNotFound />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-0">Welcome back, {userData.name}!</h1>
        <div className="flex items-center space-x-4">
          {/* Add any additional header actions here */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <Suspense fallback={<LoadingCard />}>
            <UserProfile user={userData} />
          </Suspense>
        </div>

        <Card className="p-4 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-semibold text-primary">Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-live="polite" aria-atomic="true">
              <div className="text-3xl sm:text-4xl font-bold">{userData.credits}</div>
              <p className="text-sm font-medium text-muted-foreground mt-2">Available credits</p>
            </div>
          </CardContent>
        </Card>

        <Suspense fallback={<LoadingCard />}>
          <SubscriptionStatus subscription={userData.subscriptions} />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <CourseProgress
            courses={userData?.courseProgress}
            stats={userStats}
          />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <QuizHistory quizzes={userData.userQuizzes} />
        </Suspense>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <Suspense fallback={<LoadingCard />}>
            <MyCourses courses={userData.courses} />
          </Suspense>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <Suspense fallback={<LoadingCard />}>
            <MyQuizzes quizzes={userData.userQuizzes} />
          </Suspense>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <Suspense fallback={<LoadingCard />}>
            <FavoriteCourses favorites={userData.favorites} />
          </Suspense>
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <Suspense fallback={<LoadingCard />}>
            <AIRecommendations
              courseProgress={userData.courseProgress}
              quizScores={userData.userQuizzes}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}