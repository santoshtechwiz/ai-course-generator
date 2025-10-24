import { NeoLoader, SkeletonLoader } from "@/components/loader"

export default function CourseLoading() {
	return (
		<div className="min-h-screen">
			<div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
				{/* Main loading indicator */}
				<div className="flex justify-center mb-8">
					<NeoLoader 
						message="Loading course content..." 
						size="lg" 
						variant="spinner"
					/>
				</div>

				{/* Video area skeleton */}
				<div className="grid gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 2xl:gap-10 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
					<div className="space-y-4">
						<div className="w-full aspect-video bg-[var(--color-muted)] border-4 border-[var(--color-border)] rounded-2xl animate-pulse shadow-[4px_4px_0_0_var(--color-border)]" />
						<div className="flex items-center justify-between">
							<div className="h-5 w-48 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
							<div className="h-5 w-24 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
						</div>
						{/* Tabs skeleton */}
						<div className="flex gap-2">
							{Array(4).fill(0).map((_, i) => (
								<div key={i} className="h-10 w-24 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
							))}
						</div>
						<div className="h-40 w-full bg-[var(--color-muted)] border-4 border-[var(--color-border)] rounded-xl animate-pulse shadow-[4px_4px_0_0_var(--color-border)]" />
					</div>
					{/* Sidebar skeleton */}
					<div className="space-y-4">
						<SkeletonLoader lines={2} />
						{Array(6).fill(0).map((_, i) => (
							<div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-card)] border-2 border-[var(--color-border)] rounded-lg shadow-[2px_2px_0_0_var(--color-border)]">
								<div className="h-10 w-10 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-full animate-pulse" />
								<div className="flex-1">
									<SkeletonLoader lines={2} />
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recommended section skeleton */}
				<div className="mt-10">
					<div className="h-6 w-40 mb-4 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array(6).fill(0).map((_, i) => (
							<div key={i} className="bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-2xl p-4 shadow-[4px_4px_0_0_var(--color-border)]">
								<div className="h-40 w-full bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-lg animate-pulse mb-3 shadow-[2px_2px_0_0_var(--color-border)]" />
								<SkeletonLoader lines={2} />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
