import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { ChatList, Conversation } from "@/components/coach/messages/ChatList";
import { ChatInterface } from "@/components/coach/messages/ChatInterface";
import { ContextSidebar } from "@/components/coach/messages/ContextSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteRiskAnalysis } from "@/hooks/useAthleteRiskAnalysis";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CoachMessages() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { allAthletes, isLoading } = useAthleteRiskAnalysis();
  const isMobile = useIsMobile();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showContext, setShowContext] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Convert athletes to conversations (mock data for now)
  const conversations: Conversation[] = allAthletes.map((athlete, idx) => ({
    athleteId: athlete.athleteId,
    athleteName: athlete.athleteName,
    avatarUrl: athlete.avatarUrl,
    avatarInitials: athlete.avatarInitials,
    lastMessage:
      idx === 0
        ? "Allenamento completato! 💪"
        : idx === 1
          ? "Ho un po' di dolore al ginocchio..."
          : idx === 2
            ? "🎤 Voice note (0:32)"
            : "Nessun messaggio",
    lastMessageTime:
      idx < 3 ? new Date(Date.now() - (idx + 1) * 60 * 60 * 1000) : null,
    unreadCount: idx === 0 ? 2 : idx === 1 ? 1 : 0,
    isOnline: idx < 3 && Math.random() > 0.5,
  })).sort((a, b) => {
    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
    if (!a.lastMessageTime) return 1;
    if (!b.lastMessageTime) return -1;
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChatList(true);
      setSelectedConversation(null);
    }
  };

  const handleToggleContext = () => {
    setShowContext(!showContext);
  };

  return (
    <CoachLayout title="Command Center" subtitle="Gestisci le comunicazioni con i tuoi atleti">
      <div className="animate-fade-in h-[calc(100vh-12rem)] min-h-[500px]">
        {/* 3-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full relative">
          {/* Left Pane: Chat List (20% on desktop) */}
          <div className="lg:col-span-3 xl:col-span-2 h-full">
            <ChatList
              conversations={conversations}
              isLoading={isLoading}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              isOpen={showChatList || !isMobile}
              onClose={() => setShowChatList(false)}
            />
          </div>

          {/* Center Pane: Chat Interface (50% on desktop) */}
          <div className="lg:col-span-5 xl:col-span-6 h-full">
            <ChatInterface
              conversation={selectedConversation}
              onBack={handleBackToList}
              onToggleContext={handleToggleContext}
              showContextButton={isMobile}
            />
          </div>

          {/* Right Pane: Context Sidebar (30% on desktop) */}
          <div className="lg:col-span-4 xl:col-span-4 h-full hidden lg:block">
            <ContextSidebar
              conversation={selectedConversation}
              isOpen={showContext}
              onClose={() => setShowContext(false)}
            />
          </div>
        </div>

        {/* Mobile Context Overlay */}
        {isMobile && (
          <>
            {/* Backdrop */}
            {showContext && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowContext(false)}
              />
            )}
            <ContextSidebar
              conversation={selectedConversation}
              isOpen={showContext}
              onClose={() => setShowContext(false)}
            />
          </>
        )}
      </div>
    </CoachLayout>
  );
}
