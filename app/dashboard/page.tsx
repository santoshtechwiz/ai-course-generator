import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Zap, Sparkles } from 'lucide-react';
import { getAuthSession } from "@/lib/authOptions";
import { getUserData, getUserStats } from "../actions/userDashboard";
import UserNotFound from "@/components/UserNotFound";
import UserProfile from "./components/UserProfile";
import QuizHistory from "./components/QuizHistory";
import SubscriptionStatus from "./course/components/UserDashboard/SubscriptionStatus";
import FavoriteCourses from "./components/FavoriteCourses";
import AIRecommendations from "./components/Recommendations";
import CourseProgress from "./course/components/CoursePage/CourseProgress";
import { MyCourses } from "./course/components/UserDashboard/MyCourses";
import { MyQuizzes } from "./course/components/UserDashboard/MyQuizzes";
import { QuizAttempts } from "./course/components/UserDashboard/QuizAttempts";
import { UserStatsOverview } from "./course/components/UserDashboard/UserStatsOverview";

export const dynamic = 'force-dynamic'

// function LoadingCard() {
//   return (
//     <Card className="p-4 bg-card text-card-foreground shadow-sm rounded-lg">
//       <CardHeader>
//         <Skeleton className="h-6 w-2/3" />
//       </CardHeader>
//       <CardContent>
//         <Skeleton className="h-4 w-full mb-2" />
//         <Skeleton className="h-4 w-3/4" />
//       </CardContent>
//     </Card>
//   );
// }

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to learn something new today?",
      "Your journey to knowledge continues!",
      "Every quiz brings you closer to mastery.",
      "Embrace the challenge of learning!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 lg:p-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-foreground">
                {getGreeting()}, {userData.name || 'User'}!
              </h1>
              <p className="text-muted-foreground text-lg">{getMotivationalMessage()}</p>
            </div>
            <Card className="w-full sm:w-auto bg-primary text-primary-foreground p-4 shadow-md">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">Credits: {userData.credits}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold">
                    {userData.subscriptions?.planId || "FREE"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          <Card className="bg-secondary text-secondary-foreground p-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">Quick Tip:</span>
              <span>Complete a quiz today to boost your learning streak!</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Suspense>
              <UserProfile user={userData} />
            </Suspense>

            <Suspense>
              <CourseProgress
                courses={userData.courseProgress}
                stats={userStats}
              />
            </Suspense>

            <Suspense>
              <MyCourses courses={userData.courses} />
            </Suspense>

            <Suspense>
              <MyQuizzes quizzes={userData.userQuizzes} />
            </Suspense>

            <Suspense>
              <QuizAttempts quizAttempts={userData.quizAttempts} />
            </Suspense>
          </div>

          <div className="space-y-6">
            <Suspense>
              <UserStatsOverview stats={userStats} />
            </Suspense>

            <Suspense>
              <QuizHistory quizzes={userData.userQuizzes} />
            </Suspense>

            <Suspense>
              <FavoriteCourses favorites={userData.favorites} />
            </Suspense>

            <Suspense>
              <AIRecommendations
                courses={userData.courses}
                courseProgress={userData.courseProgress}
                quizAttempts={userData.quizAttempts}
              />
            </Suspense>

            <Suspense>
              <SubscriptionStatus subscription={userData.subscriptions} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
