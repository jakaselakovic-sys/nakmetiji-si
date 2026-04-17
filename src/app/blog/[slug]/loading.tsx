import { Skeleton } from "@/components/ui/Skeleton";

export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <Skeleton className="h-6 w-1/4 mb-4" rounded="full" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="h-5 w-1/3 mb-10" />
        <Skeleton className="w-full aspect-[16/9] mb-10" rounded="2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
