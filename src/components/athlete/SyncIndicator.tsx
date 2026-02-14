import { useIsFetching } from "@tanstack/react-query";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small cloud icon that reflects global fetch + online state.
 * Green = synced, spinning = fetching, red = offline.
 */
export function SyncIndicator() {
  const isFetching = useIsFetching();
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-destructive" title="Offline">
        <CloudOff className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-none">Offline</span>
      </div>
    );
  }

  if (isFetching > 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground" title="Syncing…">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-primary/60" title="Synced">
      <Cloud className="h-4 w-4" />
    </div>
  );
}
