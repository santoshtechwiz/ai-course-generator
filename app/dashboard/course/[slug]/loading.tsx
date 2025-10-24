import { UnifiedLoader } from "@/components/loaders"

export default function CourseLoading() {
	return (
		<div className="min-h-screen bg-[var(--color-bg)]">
			<div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
				{/* Main Loader */}
				<div className="flex items-center justify-center min-h-[60vh]">
					<UnifiedLoader
						message="Loading Course..."
						variant="spinner"
						size="lg"
					/>
				</div>

				{/* Grid skeleton */}
				<div className="grid gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 2xl:gap-10 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px] mt-8">
					<div className="space-y-4">
						<div className="w-full aspect-video rounded-[var(--radius)] bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] animate-pulse" />
						<div className="flex items-center justify-between">
							<div className="h-5 w-48 bg-[var(--color-muted)] rounded animate-pulse" />
							<div className="h-5 w-24 bg-[var(--color-muted)] rounded animate-pulse" />
						</div>
						{/* Tabs skeleton */}
						<div className="flex gap-2">
							<div className="h-10 w-24 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] animate-pulse" />
							<div className="h-10 w-24 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] animate-pulse" />
							<div className="h-10 w-28 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] animate-pulse" />
							<div className="h-10 w-28 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] animate-pulse" />
						</div>
						<div className="h-40 w-full bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-neo)] animate-pulse" />
					</div>
					{/* Sidebar skeleton */}
					<div className="space-y-4">
						<div className="space-y-3 p-4 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-neo)]">
							<div className="h-6 w-3/4 bg-[var(--color-muted)] rounded animate-pulse" />
							<div className="h-3 w-1/2 bg-[var(--color-muted)] rounded animate-pulse" />
						</div>
						{Array(6).fill(0).map((_, i) => (
							<div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] animate-pulse">
								<div className="h-10 w-10 rounded-full bg-[var(--color-muted)]" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-3/4 bg-[var(--color-muted)] rounded" />
									<div className="h-3 w-1/2 bg-[var(--color-muted)] rounded" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
