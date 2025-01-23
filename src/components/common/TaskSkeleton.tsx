import { Skeleton } from "@/components/ui/skeleton";

export const TaskSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-task-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
        <div className="flex items-center gap-4 p-4 bg-white border rounded-lg">
          <Skeleton className="h-4 w-4 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
              <Skeleton className="h-5 w-16 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
              <Skeleton className="h-5 w-20 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
              <Skeleton className="h-4 w-32 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
              <Skeleton className="h-4 w-28 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
        </div>
      </div>
    ))}
  </div>
);

export const TaskSkeletonGrid = () => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div 
        key={i} 
        className="animate-task-fade-in"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <Skeleton className="h-[180px] w-full rounded-lg animate-task-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]" />
      </div>
    ))}
  </div>
);