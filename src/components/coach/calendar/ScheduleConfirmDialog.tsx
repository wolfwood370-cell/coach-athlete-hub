import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ScheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutName: string;
  targetDate: Date;
  athleteName: string;
  onConfirm: () => void;
  isScheduling: boolean;
}

export function ScheduleConfirmDialog({
  open,
  onOpenChange,
  workoutName,
  targetDate,
  athleteName,
  onConfirm,
  isScheduling,
}: ScheduleConfirmDialogProps) {
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

        {/* Athlete Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Atleta selezionato</p>
            <p className="text-sm font-medium">{athleteName}</p>
          </div>
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
            onClick={onConfirm}
            disabled={isScheduling}
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
