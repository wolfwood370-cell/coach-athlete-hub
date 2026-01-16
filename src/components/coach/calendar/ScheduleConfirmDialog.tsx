import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Dumbbell, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState, useEffect } from "react";

interface Athlete {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ScheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutName: string;
  targetDate: Date;
  athletes: Athlete[];
  selectedAthleteId: string | null;
  onConfirm: (athleteId: string) => void;
  isScheduling: boolean;
}

export function ScheduleConfirmDialog({
  open,
  onOpenChange,
  workoutName,
  targetDate,
  athletes,
  selectedAthleteId,
  onConfirm,
  isScheduling,
}: ScheduleConfirmDialogProps) {
  const [athleteId, setAthleteId] = useState<string>(selectedAthleteId || "");

  useEffect(() => {
    if (selectedAthleteId) {
      setAthleteId(selectedAthleteId);
    }
  }, [selectedAthleteId]);

  const selectedAthlete = athletes.find((a) => a.id === athleteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Conferma Programmazione
          </DialogTitle>
          <DialogDescription>
            Vuoi programmare questo workout per la data selezionata?
          </DialogDescription>
        </DialogHeader>

        {/* Workout Info */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{workoutName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">
                  {format(targetDate, "EEEE d MMMM yyyy", { locale: it })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Athlete Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Assegna a Atleta
          </label>
          <Select value={athleteId} onValueChange={setAthleteId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona atleta" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={athlete.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {(athlete.full_name || "A")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{athlete.full_name || "Atleta"}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isScheduling}
          >
            Annulla
          </Button>
          <Button
            onClick={() => athleteId && onConfirm(athleteId)}
            disabled={isScheduling || !athleteId}
          >
            {isScheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Programmazione...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Conferma
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
