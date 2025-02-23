import { Suspense } from 'react'

import { Skeleton } from "@/components/ui/skeleton"
import ProfileHeader from '@/components/features/profile/ProfileHeader'
import ProfileCourses from '@/components/features/profile/ProfileCourses'
import ProfileQuizzes from '@/components/features/profile/ProfileQuizzes'
import ProfileStats from '@/components/features/profile/ProfileStats'
import ProfileSubscription from '@/components/features/profile/ProfileSubscription'


export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <ProfileHeader />
          </Suspense>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-[100px] w-full" />}>
              <ProfileStats />
            </Suspense>
          </div>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <ProfileCourses />
            </Suspense>
          </div>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <ProfileQuizzes />
            </Suspense>
          </div>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ProfileSubscription />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
