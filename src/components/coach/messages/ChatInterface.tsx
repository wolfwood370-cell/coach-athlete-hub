import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Mic,
  Image,
  Link2,
  Info,
  ArrowLeft,
  CheckCheck,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "./ChatList";

// Mock message types for demo
type MessageType = "text" | "audio" | "image" | "link";

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  isMe: boolean;
  metadata?: {
    audioWaveform?: number[];
    audioDuration?: string;
    imageUrl?: string;
    linkPreview?: {
      title: string;
      description: string;
      thumbnail: string;
      url: string;
      provider: string;
    };
  };
}

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onBack: () => void;
  onToggleContext: () => void;
  showContextButton: boolean;
}

// Audio Waveform Component
function AudioPlayer({ waveform, duration }: { waveform: number[]; duration: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex items-center gap-0.5 flex-1">
        {waveform.map((height, i) => (
          <div
            key={i}
            className="w-1 bg-current opacity-60 rounded-full"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
      <span className="text-xs opacity-70 shrink-0">{duration}</span>
    </div>
  );
}

// Link Preview Component
function LinkPreview({
  preview,
}: {
  preview: NonNullable<Message["metadata"]>["linkPreview"];
}) {
  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors mt-2"
    >
      {preview.thumbnail && (
        <div className="aspect-video bg-muted relative">
          <img
            src={preview.thumbnail}
            alt={preview.title}
            className="w-full h-full object-cover"
          />
          {preview.provider.toLowerCase().includes("youtube") ||
            preview.provider.toLowerCase().includes("loom") ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="h-6 w-6 text-white ml-1" />
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <ExternalLink className="h-3 w-3" />
          {preview.provider}
        </div>
        <p className="text-sm font-medium line-clamp-1">{preview.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {preview.description}
        </p>
      </div>
    </a>
  );
}

// Sample messages for demo
const mockMessages: Message[] = [
  {
    id: "1",
    type: "text",
    content: "Ciao coach! Ho completato l'allenamento di oggi 💪",
    timestamp: "10:30",
    isMe: false,
  },
  {
    id: "2",
    type: "text",
    content: "Ottimo lavoro! Come ti sei sentito durante la sessione?",
    timestamp: "10:35",
    isMe: true,
  },
  {
    id: "3",
    type: "audio",
    content: "",
    timestamp: "10:40",
    isMe: false,
    metadata: {
      audioWaveform: [8, 12, 18, 14, 20, 16, 22, 18, 14, 10, 16, 20, 24, 18, 12, 8, 14, 18, 16, 12],
      audioDuration: "0:32",
    },
  },
  {
    id: "4",
    type: "image",
    content: "Post-workout selfie!",
    timestamp: "10:45",
    isMe: false,
    metadata: {
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    },
  },
  {
    id: "5",
    type: "link",
    content: "Guarda questo video sulla tecnica corretta",
    timestamp: "10:50",
    isMe: true,
    metadata: {
      linkPreview: {
        title: "Perfect Squat Form - Complete Tutorial",
        description: "Learn the perfect squat technique with this comprehensive guide covering stance, depth, and common mistakes.",
        thumbnail: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=225&fit=crop",
        url: "https://www.youtube.com/watch?v=example",
        provider: "YouTube",
      },
    },
  },
  {
    id: "6",
    type: "text",
    content: "Perfetto! Lo guardo subito. Grazie mille coach! 🙏",
    timestamp: "10:52",
    isMe: false,
  },
];

export function ChatInterface({
  conversation,
  onBack,
  onToggleContext,
  showContextButton,
}: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");

  if (!conversation) {
    return (
      <Card className="border-0 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Seleziona una conversazione
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Scegli un atleta dalla lista per iniziare a messaggiare.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {conversation.avatarInitials}
              </AvatarFallback>
            </Avatar>
            {conversation.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{conversation.athleteName}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation.isOnline ? "Online" : "Ultima attività 2h fa"}
            </p>
          </div>
        </div>

        {/* Context Toggle (Mobile) */}
        {showContextButton && (
          <Button variant="ghost" size="icon" onClick={onToggleContext}>
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  msg.isMe
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                )}
              >
                {/* Text Message */}
                {msg.type === "text" && (
                  <p className="text-sm">{msg.content}</p>
                )}

                {/* Audio Message */}
                {msg.type === "audio" && msg.metadata?.audioWaveform && (
                  <AudioPlayer
                    waveform={msg.metadata.audioWaveform}
                    duration={msg.metadata.audioDuration || "0:00"}
                  />
                )}

                {/* Image Message */}
                {msg.type === "image" && (
                  <div>
                    {msg.content && (
                      <p className="text-sm mb-2">{msg.content}</p>
                    )}
                    <img
                      src={msg.metadata?.imageUrl}
                      alt="Shared image"
                      className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}

                {/* Link Message with Preview */}
                {msg.type === "link" && (
                  <div>
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    <LinkPreview preview={msg.metadata?.linkPreview} />
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  <span className="text-[10px]">{msg.timestamp}</span>
                  {msg.isMe && <CheckCheck className="h-3 w-3" />}
                </div>
              </div>
            </div>
          ))}

          {/* Coming Soon Notice */}
          <div className="text-center py-4">
            <Badge variant="secondary" className="text-xs">
              Chat in tempo reale in arrivo
            </Badge>
          </div>
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex items-end gap-2">
          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Mic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Link2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              placeholder="Scrivi un messaggio..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>

          {/* Send Button */}
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!messageText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Cost-saving note */}
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          💡 Per i video, usa Loom o YouTube e condividi il link
        </p>
      </div>
    </Card>
  );
}
