import { GlobalLoader } from "@/components/ui/loader"

export function CoursesListSkeleton() {
  return <GlobalLoader variant="skeleton" className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto" />
}
