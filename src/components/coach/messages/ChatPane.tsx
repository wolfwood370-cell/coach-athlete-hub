import { useState, useRef, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowLeft,
  Info,
  Send,
  Mic,
  Image as ImageIcon,
  Link2,
  Loader2,
  Video,
  AlertTriangle,
  X,
  Dumbbell,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChatRoom, Message, useMessages } from "@/hooks/useChatRooms";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { log } from "@/lib/logger";

const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

interface AlertContextData {
  message: string;
  severity: "high" | "medium" | "low";
  workoutLogId: string | null;
  createdAt: string;
}

interface ChatPaneProps {
  room: ChatRoom | null;
  onBack?: () => void;
  onToggleContext?: () => void;
  showBackButton?: boolean;
  alertContext?: AlertContextData | null;
}

function DateSeparator({ date }: { date: Date }) {
  let label = format(date, "d MMMM yyyy", { locale: it });
  if (isToday(date)) label = "Oggi";
  else if (isYesterday(date)) label = "Ieri";

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function ChatPane({
  room,
  onBack,
  onToggleContext,
  showBackButton = false,
  alertContext,
}: ChatPaneProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, subscribeToMessages } = useMessages(room?.id || null);
  const [inputValue, setInputValue] = useState(
    alertContext
      ? `Hey, ho visto quella sessione intensa. ${alertContext.message}. Tutto bene?`
      : "",
  );
  const [showAlertBanner, setShowAlertBanner] = useState(!!alertContext);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = room?.participants.find((p) => p.user_id !== user?.id)?.profile;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to realtime
  useEffect(() => {
    if (!room?.id) return;
    const unsubscribe = subscribeToMessages(() => {
      // Message received - scroll will happen via messages dependency
    });
    return unsubscribe;
  }, [room?.id, subscribeToMessages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      // Detect if it's a video link
      const isVideoLink = /loom\.com|youtube\.com|youtu\.be/.test(content);

      await sendMessage.mutateAsync({
        content,
        media_type: isVideoLink ? "loom" : "text",
      });
    } catch (error) {
      toast.error("Errore nell'invio del messaggio");
      setInputValue(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaClick = (type: "audio" | "image" | "link" | "video") => {
    switch (type) {
      case "audio":
        toast.info("Registrazione vocale in arrivo...", {
          description: "Funzionalità in sviluppo",
        });
        break;
      case "image":
        toast.info("Caricamento immagine...", { description: "Funzionalità in sviluppo" });
        break;
      case "link": {
        const url = prompt("Inserisci un link YouTube o Loom:");
        if (url) {
          setInputValue(url);
          inputRef.current?.focus();
        }
        break;
      }
      case "video":
        videoInputRef.current?.click();
        break;
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Reset input
    e.target.value = "";

    // Size check
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("Video troppo grande", {
        description: "Per favore comprimilo o invia una clip più breve (max 50MB).",
      });
      return;
    }

    // Duration warning (using video element to get duration)
    const videoDurationPromise = new Promise<number>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });

    const duration = await videoDurationPromise;

    if (duration > 120) {
      // More than 2 minutes
      const proceed = window.confirm(
        `Il video dura ${Math.round(duration / 60)} minuti. Vuoi continuare? Per video lunghi, considera di usare Loom.`,
      );
      if (!proceed) return;
    }

    setIsUploadingVideo(true);

    try {
      // Upload to chat-media/videos/{userId}/{timestamp}_{filename}
      const timestamp = Date.now();
      const filePath = `videos/${user.id}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get signed URL (bucket is now private for security)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("chat-media")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError || new Error("Failed to create signed URL");
      }

      // Send message with video - store the file path for regenerating signed URLs
      // The media_url stores the path, and we regenerate signed URLs when displaying
      await sendMessage.mutateAsync({
        content: `Video: ${file.name}`,
        media_type: "video_native" as "text",
        media_url: filePath, // Store path instead of URL for security
      });

      toast.success("Video caricato con successo!");
    } catch (error) {
      log.error("Video upload error:", error);
      toast.error("Errore nel caricamento del video");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: typeof messages }[] = [];
  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at);
    const dateKey = format(msgDate, "yyyy-MM-dd");

    const existing = groupedMessages.find((g) => format(g.date, "yyyy-MM-dd") === dateKey);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groupedMessages.push({ date: msgDate, messages: [msg] });
    }
  });

  if (!room) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-container-lowest text-on-surface-variant">
        <div className="text-center p-8">
          <div className="h-16 w-16 rounded-full bg-primary-container/10 flex items-center justify-center mx-auto mb-4">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-label-md font-bold text-on-surface mb-1">
            Seleziona una conversazione
          </h3>
          <p className="text-sm">Scegli un atleta dalla lista per iniziare.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest font-sans">
      {/* ═══ Workspace Header (sticky) ═══
          Aura sub-bar: prominent athlete avatar + name + active phase
          context. The header is wrapped in `sticky top-0` so it floats
          above the scroll track while the conversation flows underneath. */}
      <header className="sticky top-0 z-10 h-16 shrink-0 border-b border-outline-variant/20 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-between px-5">
        <div className="flex items-center gap-3 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Indietro"
              className="h-9 w-9 rounded-full"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Profile picture frame — ring with the Aura outline-variant for a
              subtle "framed" look (matches premium messaging apps). */}
          <Avatar className="h-10 w-10 ring-2 ring-outline-variant/40 ring-offset-2 ring-offset-surface-container-lowest">
            <AvatarImage src={otherParticipant?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary-container/15 text-primary text-sm font-bold">
              {otherParticipant?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h3 className="font-display text-label-md font-bold text-on-surface truncate">
              {otherParticipant?.full_name || "Utente"}
            </h3>
            {/* Active block context — placeholder until the athlete's current
                training phase is wired in from useCoachData (TODO). The
                badge gives the coach the working-memory cue that the
                conversation is anchored to a specific mesocycle. */}
            <p className="text-xs text-on-surface-variant truncate flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-primary" />
              <span>
                <span className="font-semibold text-primary">Fase:</span> Ipertrofia Meccanica
              </span>
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Informazioni atleta"
          className="h-9 w-9 rounded-full"
          onClick={onToggleContext}
        >
          <Info className="h-4 w-4" />
        </Button>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "flex-row-reverse" : "")}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : groupedMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nessun messaggio</p>
              <p className="text-xs mt-1">Inizia la conversazione!</p>
            </div>
          ) : (
            groupedMessages.map((group, gi) => (
              <div key={gi}>
                <DateSeparator date={group.date} />
                {group.messages.map((msg, mi) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === user?.id}
                    showAvatar={mi === 0 || group.messages[mi - 1]?.sender_id !== msg.sender_id}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Hidden video input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoSelect}
      />

      {/* Alert Context Banner */}
      {showAlertBanner && alertContext && (
        <div className="shrink-0 border-t border-warning/30 bg-warning/5 px-4 py-2 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-warning">Contesto Avviso</p>
            <p className="text-xs text-muted-foreground truncate">{alertContext.message}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ignora avviso"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => setShowAlertBanner(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* ═══ Message Input Area — Aura sleek pill row ═══
          Pill-shaped container holding (1) the exercise-library injection
          short-track on the far left, (2) a transparent text input in the
          middle, and (3) an absolutely-positioned attachment utility panel
          on the right with the standard media icons. Send is the only
          control outside the pill — a primary CTA on the right edge. */}
      <footer className="shrink-0 border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
        <div className="flex items-end gap-2">
          {/* Pill input row */}
          <div className="relative flex-1 flex items-center bg-surface-container-low rounded-full border border-outline-variant/40 transition-[box-shadow,border-color] duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgb(0_86_133_/_0.12)] pl-1.5 pr-1.5">
            {/* Exercise-library injection short-track (Dumbbell) — primary
                action of the row, anchored to the far left. */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Inietta esercizio dalla libreria"
              title="Inserisci esercizio dalla libreria"
              className="h-9 w-9 rounded-full text-primary hover:bg-primary-container/15 shrink-0"
              onClick={() =>
                toast.info("Libreria esercizi in arrivo", {
                  description:
                    "Selezione rapida dalla libreria coach per allegare un esercizio o un programma alla chat.",
                })
              }
              disabled={isUploadingVideo}
            >
              <Dumbbell className="h-4 w-4" />
            </Button>

            {/* Transparent text input */}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio…"
              aria-label="Scrivi un messaggio"
              className={cn(
                "flex-1 h-10 bg-transparent border-0 shadow-none px-3",
                "focus-visible:ring-0 focus-visible:shadow-none placeholder:text-on-surface-variant/70",
              )}
              disabled={isSending}
            />

            {/* Absolute attachment utility panel — anchored right inside the
                pill. Each icon is a tappable pill action that maps to a
                specific media type. */}
            <nav aria-label="Allegati" className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Registra audio"
                title="Registra audio"
                className="h-9 w-9 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                onClick={() => handleMediaClick("audio")}
                disabled={isUploadingVideo}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Allega immagine"
                title="Allega immagine"
                className="h-9 w-9 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                onClick={() => handleMediaClick("image")}
                disabled={isUploadingVideo}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Video Clip (max 50MB)"
                title="Video Clip (max 50MB)"
                className="h-9 w-9 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                onClick={() => handleMediaClick("video")}
                disabled={isUploadingVideo}
              >
                {isUploadingVideo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Allega link Loom/YouTube"
                title="Allega link Loom/YouTube"
                className="h-9 w-9 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                onClick={() => handleMediaClick("link")}
                disabled={isUploadingVideo}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </nav>
          </div>

          {/* Send — primary pill CTA, sits outside the input pill for emphasis */}
          <Button
            size="icon"
            aria-label="Invia messaggio"
            className="h-11 w-11 shrink-0 shadow-[0_4px_14px_rgb(0_62_98_/_0.20)]"
            disabled={!inputValue.trim() || isSending}
            onClick={handleSend}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
