import { Skeleton } from "@/components/ui/skeleton"

export default function CourseLoading() {
	return (
		<div className="min-h-screen">
			<div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
				{/* Video area skeleton */}
				<div className="grid gap-6 md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
					<div className="space-y-4">
						<Skeleton className="w-full aspect-video rounded-lg" />
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-5 w-24" />
						</div>
						{/* Tabs skeleton */}
						<div className="flex gap-2">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-28" />
							<Skeleton className="h-10 w-28" />
						</div>
						<Skeleton className="h-40 w-full" />
					</div>
					{/* Sidebar skeleton */}
					<div className="space-y-4">
						<div className="space-y-3">
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
						{Array(6).fill(0).map((_, i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recommended section skeleton */}
				<div className="mt-10">
					<Skeleton className="h-6 w-40 mb-4" />
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array(6).fill(0).map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="h-40 w-full rounded-lg" />
								<Skeleton className="h-4 w-2/3" />
								<Skeleton className="h-3 w-1/2" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
