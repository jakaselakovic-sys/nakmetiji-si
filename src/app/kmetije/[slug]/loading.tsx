import { Skeleton } from "@/components/ui/Skeleton";

export default function FarmProfileLoading() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero image skeleton */}
      <Skeleton className="w-full h-[50vh]" rounded="sm" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            {/* Gallery grid skeleton */}
            <div className="grid grid-cols-3 gap-3 pt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" rounded="2xl" />
              ))}
            </div>
          </div>

          {/* Sidebar / booking */}
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" rounded="2xl" />
            <Skeleton className="h-12 w-full" rounded="2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
