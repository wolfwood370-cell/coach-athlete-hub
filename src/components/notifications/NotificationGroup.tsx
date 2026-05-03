import { cn } from "@/lib/utils";
import { NotificationItem, type NotificationData } from "./NotificationItem";

interface NotificationGroupProps {
  /** Titolo del gruppo, es: "TODAY", "EARLIER", "THIS WEEK". */
  title: string;
  notifications: NotificationData[];
  className?: string;
}

/**
 * Raggruppa una lista di notifiche sotto un header in tracking widest.
 * Rende nulla se il gruppo è vuoto (per evitare header orfani).
 */
export function NotificationGroup({
  title,
  notifications,
  className,
}: NotificationGroupProps) {
  if (notifications.length === 0) return null;

  return (
    <section className={cn("mt-6 first:mt-0", className)}>
      <h2
        className={cn(
          "text-[10px] font-semibold tracking-widest uppercase",
          "text-on-surface-variant mb-4",
        )}
      >
        {title}
      </h2>
      <div className="flex flex-col">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>
    </section>
  );
}
