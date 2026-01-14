import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { MessageSquare, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CoachMessages() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  return (
    <CoachLayout title="Messages" subtitle="Communicate with your athletes">
      <div className="animate-fade-in h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <Card className="lg:col-span-1 border-0 shadow-sm flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {/* Placeholder conversations */}
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          A{i}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Athlete {i}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          No messages yet
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 border-0 shadow-sm flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Empty State */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Choose an athlete from the list to start messaging. Real-time chat coming soon!
                </p>
              </div>

              {/* Message Input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Type a message..." 
                    className="min-h-[44px] max-h-32 resize-none"
                    rows={1}
                  />
                  <Button size="icon" className="h-11 w-11 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
}
