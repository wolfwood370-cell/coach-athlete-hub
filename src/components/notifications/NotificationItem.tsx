import { cn } from "@/lib/utils";

export type NotificationCategory =
  | "coach"
  | "checkin"
  | "training"
  | "nutrition"
  | "copilot"
  | "billing"
  | "achievement";

export interface NotificationData {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  /** Tempo relativo già formattato, es: "10m ago", "Yesterday", "Oct 12". */
  timeAgo: string;
  isUnread: boolean;
  /** URL avatar opzionale (ha priorità sull'icona di categoria). */
  avatarUrl?: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  className?: string;
}

const CATEGORY_ICON: Record<NotificationCategory, string> = {
  coach: "person",
  checkin: "assignment",
  training: "fitness_center",
  nutrition: "restaurant",
  copilot: "smart_toy",
  billing: "credit_card",
  achievement: "workspace_premium",
};

/**
 * Riga singola del centro notifiche.
 *
 * Due varianti visive guidate da `isUnread`:
 *
 * - **Unread**: container con sfondo `surface-container-low`, dot blu
 *   in alto a sinistra, testo a piena opacità.
 * - **Read**: senza sfondo, separatore sottile in basso, testo
 *   sbiadito (variante neutra).
 *
 * L'avatar (se fornito) sostituisce l'icona di categoria — tipico per
 * messaggi diretti dal Coach.
 */
export function NotificationItem({
  notification,
  className,
}: NotificationItemProps) {
  const { category, title, body, timeAgo, isUnread, avatarUrl } = notification;
  const iconName = CATEGORY_ICON[category];

  // Layout shared, contenuto identico — la differenza sta solo nel chrome.
  if (isUnread) {
    return (
      <article
        className={cn(
          "relative bg-surface-container-low rounded-lg p-4 mb-3",
          "flex items-start gap-4",
          className,
        )}
      >
        <span
          className="absolute top-4 left-3 w-2 h-2 rounded-full bg-primary-container"
          aria-label="Non letto"
        />
        <NotificationMedia
          avatarUrl={avatarUrl}
          iconName={iconName}
          variant="unread"
        />
        <div className="flex-1 min-w-0 ml-3">
          <p className="font-semibold text-on-surface text-sm truncate">
            {title}
          </p>
          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
            {body}
          </p>
        </div>
        <span className="text-xs font-medium text-primary-container whitespace-nowrap">
          {timeAgo}
        </span>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "bg-transparent border-b border-outline-variant/30",
        "py-4 mb-1 flex items-start gap-4 pl-3 pr-4 last:border-b-0",
        className,
      )}
    >
      <NotificationMedia
        avatarUrl={avatarUrl}
        iconName={iconName}
        variant="read"
      />
      <div className="flex-1 min-w-0">
        <p className="font-normal text-on-surface-variant text-sm truncate">
          {title}
        </p>
        <p className="text-sm text-outline mt-1 line-clamp-1">{body}</p>
      </div>
      <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap">
        {timeAgo}
      </span>
    </article>
  );
}

/* -- helper visuale interno ------------------------------------------------ */

interface NotificationMediaProps {
  avatarUrl?: string;
  iconName: string;
  variant: "read" | "unread";
}

function NotificationMedia({
  avatarUrl,
  iconName,
  variant,
}: NotificationMediaProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="w-12 h-12 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
        variant === "unread"
          ? "bg-white text-primary-container"
          : "bg-surface-container-low text-on-surface-variant",
      )}
      aria-hidden
    >
      <span className="material-symbols-outlined">{iconName}</span>
    </div>
  );
}
