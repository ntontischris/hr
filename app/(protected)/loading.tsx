import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLoading() {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r p-4 gap-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <div className="flex h-14 items-center border-b px-4 gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Chat skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-20 w-3/4" />
          </div>
          <div className="flex gap-3 justify-end">
            <Skeleton className="h-12 w-1/2" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-32 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
