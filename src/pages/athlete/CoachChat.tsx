import { useState, useRef, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, PlusCircle, Send } from "lucide-react";

interface ChatMessage {
  id: number;
  sender: "coach" | "athlete";
  text: string;
  time: string;
}

const COACH_AVATAR =
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=faces";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    sender: "coach",
    text: "Ottimo lavoro con gli squat ieri. Assicurati di dare priorità al recupero oggi.",
    time: "10:00",
  },
  {
    id: 2,
    sender: "athlete",
    text: "Grazie! Lo farò. Sento un po' di indolenzimento ai quadricipiti.",
    time: "10:05",
  },
  {
    id: 3,
    sender: "coach",
    text: "Capito. Ho modificato la tua routine di mobilità nel focus di oggi.",
    time: "10:10",
  },
];

const formatTime = (date: Date): string =>
  date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

export default function CoachChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const next: ChatMessage = {
      id: Date.now(),
      sender: "athlete",
      text: trimmed,
      time: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, next]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest font-sans flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-lg border-b border-surface-variant shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={COACH_AVATAR}
              alt="Coach Alexander"
              className="relative w-10 h-10 rounded-full object-cover border border-outline-variant/30"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <h1 className="font-display text-lg font-semibold text-on-surface">
            Coach Alexander
          </h1>
        </div>

        <button
          type="button"
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Videochiamata"
        >
          <Video className="w-6 h-6" />
        </button>
      </header>

      {/* Chat Canvas */}
      <main className="flex-1 overflow-y-auto px-4 pt-24 pb-28 flex flex-col gap-6 w-full max-w-2xl mx-auto">
        {messages.map((msg) =>
          msg.sender === "coach" ? (
            <div key={msg.id} className="flex items-end gap-3 self-start max-w-[85%]">
              <img
                src={COACH_AVATAR}
                alt="Coach"
                className="w-8 h-8 rounded-full shrink-0 object-cover"
              />
              <div>
                <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-bl-sm shadow-sm">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 ml-1">{msg.time}</p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-3 self-end max-w-[85%]">
              <div className="flex flex-col items-end">
                <div className="bg-primary-container text-white p-4 rounded-2xl rounded-br-sm shadow-sm">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 mr-1 text-right">
                  {msg.time}
                </p>
              </div>
            </div>
          )
        )}
        <div ref={scrollRef} />
      </main>

      {/* Bottom Input */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-surface-variant p-4 pb-8 z-50"
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            className="text-on-surface-variant hover:text-primary shrink-0 transition-colors"
            aria-label="Allega"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi al coach..."
            className="flex-1 bg-surface-container-low text-on-surface text-base rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/70"
          />

          <button
            type="submit"
            className="bg-primary-container text-white p-3 rounded-full flex items-center justify-center shrink-0 hover:scale-95 transition-transform shadow-sm"
            aria-label="Invia"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
