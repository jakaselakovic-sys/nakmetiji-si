import { Suspense } from "react";
import { PotrdiClient } from "./PotrdiClient";

export default function PotrdiPage() {
  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-earth-500 animate-pulse text-sm font-medium">Nalaganje rezervacije...</div>
      }>
        <PotrdiClient />
      </Suspense>
    </div>
  );
}
