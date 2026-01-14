import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteRiskAnalysis } from "@/hooks/useAthleteRiskAnalysis";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  Search, 
  Send, 
  Video, 
  Paperclip, 
  Smile,
  Phone,
  MoreVertical,
  Check,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Conversation {
  athleteId: string;
  athleteName: string;
  avatarUrl: string | null;
  avatarInitials: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  unreadCount: number;
  isOnline: boolean;
}

export default function CoachMessages() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { allAthletes, isLoading } = useAthleteRiskAnalysis();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");

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
    lastMessage: idx === 0 ? "Allenamento completato! 💪" : 
                 idx === 1 ? "Ho un po' di dolore al ginocchio..." :
                 "Nessun messaggio",
    lastMessageTime: idx < 2 ? new Date(Date.now() - (idx + 1) * 60 * 60 * 1000) : null,
    unreadCount: idx === 0 ? 2 : 0,
    isOnline: idx < 3 && Math.random() > 0.5,
  })).sort((a, b) => {
    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
    if (!a.lastMessageTime) return 1;
    if (!b.lastMessageTime) return -1;
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.athleteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (date: Date | null) => {
    if (!date) return "";
    return formatDistanceToNow(date, { addSuffix: false, locale: it });
  };

  return (
    <CoachLayout title="Messages" subtitle="Comunica con i tuoi atleti">
      <div className="animate-fade-in h-[calc(100vh-12rem)] min-h-[500px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          
          {/* ===== LEFT SIDEBAR: CONVERSATIONS LIST ===== */}
          <Card className="lg:col-span-4 xl:col-span-3 border-0 shadow-sm flex flex-col overflow-hidden">
            {/* Search Header */}
            <CardHeader className="pb-2 flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Conversazioni</h2>
                <Badge variant="secondary" className="tabular-nums">
                  {conversations.length}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cerca..." 
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            
            {/* Conversations List */}
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="p-2 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p className="text-sm">Nessun atleta trovato</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.athleteId}
                        onClick={() => setSelectedConversation(conv)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                          "hover:bg-muted/50",
                          selectedConversation?.athleteId === conv.athleteId && "bg-muted"
                        )}
                      >
                        {/* Avatar with Online Status */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {conv.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          {conv.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                          )}
                        </div>
                        
                        {/* Name & Last Message */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              conv.unreadCount > 0 ? "font-semibold" : "font-medium"
                            )}>
                              {conv.athleteName}
                            </p>
                            {conv.lastMessageTime && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {getTimeAgo(conv.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={cn(
                              "text-xs truncate",
                              conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] shrink-0">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* ===== RIGHT AREA: CHAT WINDOW ===== */}
          <Card className="lg:col-span-8 xl:col-span-9 border-0 shadow-sm flex flex-col overflow-hidden">
            {!selectedConversation ? (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Seleziona una conversazione</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Scegli un atleta dalla lista per iniziare a messaggiare. La chat in tempo reale sarà disponibile presto!
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {selectedConversation.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConversation.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{selectedConversation.athleteName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Tabs defaultValue="chat" className="mr-2">
                      <TabsList className="h-8 p-0.5">
                        <TabsTrigger value="chat" className="h-7 px-3 text-xs">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Chat
                        </TabsTrigger>
                        <TabsTrigger value="video" className="h-7 px-3 text-xs">
                          <Video className="h-3.5 w-3.5 mr-1" />
                          Video
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Sample Messages - Placeholder */}
                    <div className="flex justify-start">
                      <div className="max-w-[70%] bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
                        <p className="text-sm">Ciao coach! Ho completato l'allenamento di oggi 💪</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">10:30</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
                        <p className="text-sm">Ottimo lavoro! Come ti sei sentito durante la sessione?</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-primary-foreground/70">10:35</span>
                          <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="max-w-[70%] bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
                        <p className="text-sm">Benissimo! RPE 7, ho seguito tutte le indicazioni. Solo un po' di affaticamento sui leg press.</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">10:42</span>
                        </div>
                      </div>
                    </div>

                    {/* Coming Soon Notice */}
                    <div className="text-center py-8">
                      <Badge variant="secondary" className="text-xs">
                        Chat in tempo reale in arrivo
                      </Badge>
                    </div>
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Textarea 
                        placeholder="Scrivi un messaggio..." 
                        className="min-h-[44px] max-h-32 resize-none pr-10"
                        rows={1}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 absolute right-1 bottom-1"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      size="icon" 
                      className="h-10 w-10 shrink-0"
                      disabled={!messageText.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
}
