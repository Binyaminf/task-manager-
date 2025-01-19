import { Skeleton } from "@/components/ui/skeleton";

export const TaskSkeleton = () => (
  <div className="space-y-2">
    <div className="flex items-center gap-4 p-4 bg-white border rounded-lg">
      <Skeleton className="h-4 w-4" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  </div>
);

export const TaskSkeletonGrid = () => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>
    ))}
  </div>
);