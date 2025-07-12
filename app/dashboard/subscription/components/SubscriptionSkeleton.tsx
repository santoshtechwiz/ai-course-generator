

const SubscriptionSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-1/3 h-6 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-1/3 h-6 bg-gray-200 animate-pulse rounded"></div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
      </div>
    </div>
  );
}

export default SubscriptionSkeleton;
