import { Skeleton } from "@/components/ui/skeleton";

export const LoadingFallback = () => (
  <div className="container py-8">
    <div className="space-y-8">
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  </div>
);