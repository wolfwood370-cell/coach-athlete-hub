import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout";
import { NotificationGroup } from "@/components/notifications";
import { mockNotifications } from "@/data";

/**
 * Notifications — centro notifiche.
 *
 * Header dedicato (non riusa `<Header>` perché ha layout diverso:
 * back arrow + titolo centrato + "Mark all read" trailing).
 *
 * Body: due gruppi `TODAY` ed `EARLIER` separati, popolati dai mock.
 *
 * Naviga a indietro tramite `useNavigate(-1)` — funziona indipendentemente
 * dalla page di provenienza (Dashboard / Training / etc.).
 */
export default function Notifications() {
  const navigate = useNavigate();
  const { today, earlier } = mockNotifications;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header dedicato */}
      <header
        className={[
          "fixed top-0 left-0 w-full z-50",
          "flex justify-between items-center px-6 py-4",
          "bg-white/70 backdrop-blur-2xl border-b border-outline-variant/20",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className={[
            "text-primary-container hover:bg-surface-container-low",
            "active:scale-95 duration-200 transition-all p-2 rounded-full",
            "flex items-center justify-center",
          ].join(" ")}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1
          className={[
            "font-headline-lg text-headline-lg text-on-surface",
            "absolute left-1/2 -translate-x-1/2",
          ].join(" ")}
        >
          Notifications
        </h1>
        <button
          type="button"
          className={[
            "text-primary-container hover:bg-surface-container-low",
            "active:scale-95 duration-200 transition-all px-3 py-1.5 rounded-lg",
            "font-label-sm text-label-sm",
          ].join(" ")}
        >
          Mark all read
        </button>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-margin-mobile pt-24 pb-32">
        <NotificationGroup title="TODAY" notifications={today} />
        <NotificationGroup title="EARLIER" notifications={earlier} />
      </main>

      <BottomNav active="dashboard" />
    </div>
  );
}
