import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 md:px-6 xl:px-8">
      <div className="hidden w-72 xl:block">
        <Skeleton className="h-[80vh] rounded-3xl" />
      </div>
      <div className="flex-1 space-y-6">
        <Skeleton className="h-28 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
