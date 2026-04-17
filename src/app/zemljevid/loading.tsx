import { Skeleton } from "@/components/ui/Skeleton";
import { MapPin } from "lucide-react";

export default function MapLoading() {
  return (
    <div className="h-[calc(100vh-64px)] w-full bg-earth-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-forest-100 flex items-center justify-center animate-pulse">
          <MapPin size={28} className="text-forest-600" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="h-5 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>
    </div>
  );
}
