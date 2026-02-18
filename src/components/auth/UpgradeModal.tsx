import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade richiesto
          </DialogTitle>
          <DialogDescription>
            {feature
              ? `La funzionalità "${feature}" non è inclusa nel tuo piano attuale.`
              : "Questa funzionalità non è inclusa nel tuo piano attuale."}
            {" "}Passa a un piano superiore per sbloccarla.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
          <Button asChild>
            <a href="mailto:support@coachathletehub.com">Contattaci</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
