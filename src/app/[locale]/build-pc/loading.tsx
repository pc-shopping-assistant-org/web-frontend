import {Skeleton} from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="space-y-6 px-6 py-10"><Skeleton className="h-20 w-3/4" /><Skeleton className="h-32" /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"><Skeleton className="h-[600px]" /><Skeleton className="h-96" /></div></div>;
}
