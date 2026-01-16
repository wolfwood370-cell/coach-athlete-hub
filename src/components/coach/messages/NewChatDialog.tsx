import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAthleteRiskAnalysis } from "@/hooks/useAthleteRiskAnalysis";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAthlete: (athleteId: string) => void;
  isCreating: boolean;
}

export function NewChatDialog({
  open,
  onOpenChange,
  onSelectAthlete,
  isCreating
}: NewChatDialogProps) {
  const { allAthletes, isLoading } = useAthleteRiskAnalysis();
  const [search, setSearch] = useState("");

  const filteredAthletes = allAthletes.filter(athlete =>
    athlete.athleteName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova Conversazione</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca atleta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAthletes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {search ? "Nessun atleta trovato" : "Nessun atleta disponibile"}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAthletes.map(athlete => (
                  <button
                    key={athlete.athleteId}
                    onClick={() => onSelectAthlete(athlete.athleteId)}
                    disabled={isCreating}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      "hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={athlete.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {athlete.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{athlete.athleteName}</span>
                    </div>
                    {isCreating && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
