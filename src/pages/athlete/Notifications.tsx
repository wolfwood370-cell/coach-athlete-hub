import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  MessageCircle,
  Dumbbell,
  CreditCard,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";

type NotificationType = "message" | "task" | "system" | "payment";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: NotificationType;
  group: "today" | "previous";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Nuovo messaggio dal Coach",
    message:
      "Ottimo lavoro questa settimana! Ho aggiornato il programma per la prossima fase, fammi sapere cosa ne pensi.",
    time: "10 min",
    isRead: false,
    type: "message",
    group: "today",
  },
  {
    id: "2",
    title: "Check-in Settimanale",
    message: "È il momento di registrare peso e foto progresso.",
    time: "2 ore",
    isRead: false,
    type: "task",
    group: "today",
  },
  {
    id: "3",
    title: "Workout completato",
    message: "Hai completato 'Upper Body — Forza Massimale'. Ottima sessione!",
    time: "Ieri",
    isRead: true,
    type: "system",
    group: "previous",
  },
  {
    id: "4",
    title: "Pagamento ricevuto",
    message: "Abbonamento Premium rinnovato con successo.",
    time: "3g",
    isRead: true,
    type: "payment",
    group: "previous",
  },
  {
    id: "5",
    title: "Nuovo programma disponibile",
    message: "Mesociclo Ipertrofia — Fase 2 è ora attivo nel tuo calendario.",
    time: "5g",
    isRead: true,
    type: "system",
    group: "previous",
  },
];

const ICON_MAP: Record<NotificationType, LucideIcon> = {
  message: MessageCircle,
  task: ClipboardList,
  system: Dumbbell,
  payment: CreditCard,
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const todayItems = notifications.filter((n) => n.group === "today");
  const previousItems = notifications.filter((n) => n.group === "previous");

  const renderItem = (n: NotificationItem) => {
    const Icon = ICON_MAP[n.type] ?? Bell;

    if (!n.isRead) {
      return (
        <div
          key={n.id}
          className="relative bg-surface-container-low rounded-2xl p-4 mb-3 flex items-start gap-4"
        >
          <span className="absolute top-4 left-3 w-2 h-2 rounded-full bg-primary-container" />
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center ml-3 shrink-0 text-primary-container shadow-sm">
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-on-surface text-sm">
                {n.title}
              </h3>
              <span className="text-xs font-medium text-primary-container whitespace-nowrap">
                {n.time}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
              {n.message}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        key={n.id}
        className="bg-white border-b border-surface-variant/50 py-4 mb-1 flex items-start gap-4 pl-3 pr-4"
      >
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0 text-on-surface-variant">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-normal text-on-surface-variant text-sm">
              {n.title}
            </h3>
            <span className="text-xs font-medium text-outline whitespace-nowrap">
              {n.time}
            </span>
          </div>
          <p className="text-sm text-outline mt-1 line-clamp-1">{n.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-2xl border-b border-surface-variant shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className="text-on-surface hover:text-primary-container transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-semibold absolute left-1/2 -translate-x-1/2 text-on-surface">
          Notifiche
        </h1>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          Segna tutte come lette
        </button>
      </header>

      {/* Main */}
      <main className="max-w-md mx-auto px-6 pt-24 pb-32">
        {todayItems.length > 0 && (
          <>
            <h2 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-4 mt-6">
              Oggi
            </h2>
            {todayItems.map(renderItem)}
          </>
        )}

        {previousItems.length > 0 && (
          <>
            <h2 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-4 mt-6">
              Precedenti
            </h2>
            {previousItems.map(renderItem)}
          </>
        )}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 text-on-surface-variant">
            <Bell size={32} className="mb-3 opacity-60" />
            <p className="text-sm">Nessuna notifica al momento.</p>
          </div>
        )}
      </main>

      <AthleteBottomNav />
    </div>
  );
};

export default Notifications;
