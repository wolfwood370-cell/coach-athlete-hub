import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWeeks: number;
  currentWeek: number;
  onSave: (config: BlockSaveConfig) => void;
  isLoading?: boolean;
}

export interface BlockSaveConfig {
  name: string;
  description: string;
  startWeek: number;
  endWeek: number;
}

export function SaveBlockDialog({
  open,
  onOpenChange,
  totalWeeks,
  currentWeek,
  onSave,
  isLoading,
}: SaveBlockDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startWeek, setStartWeek] = useState(0);
  const [endWeek, setEndWeek] = useState(Math.min(3, totalWeeks - 1));

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setStartWeek(0);
      setEndWeek(Math.min(3, totalWeeks - 1));
    } else {
      // Pre-select current week as start
      setStartWeek(currentWeek);
      setEndWeek(Math.min(currentWeek + 3, totalWeeks - 1));
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        description: description.trim(),
        startWeek,
        endWeek,
      });
    }
  };

  const weekCount = endWeek - startWeek + 1;
  const isValidRange = startWeek <= endWeek && weekCount >= 1 && weekCount <= 12;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Salva come Blocco Template
          </DialogTitle>
          <DialogDescription>
            Salva un range di settimane come template riutilizzabile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="block-name">Nome del blocco *</Label>
            <Input
              id="block-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Fase Ipertrofia 1"
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="block-description">Descrizione</Label>
            <Textarea
              id="block-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opzionale: descrivi l'obiettivo del blocco..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Week Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-week">Dalla settimana</Label>
              <Select
                value={startWeek.toString()}
                onValueChange={(v) => {
                  const newStart = parseInt(v);
                  setStartWeek(newStart);
                  if (newStart > endWeek) {
                    setEndWeek(Math.min(newStart + 3, totalWeeks - 1));
                  }
                }}
              >
                <SelectTrigger id="start-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      Settimana {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-week">Alla settimana</Label>
              <Select
                value={endWeek.toString()}
                onValueChange={(v) => setEndWeek(parseInt(v))}
              >
                <SelectTrigger id="end-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <SelectItem
                      key={i}
                      value={i.toString()}
                      disabled={i < startWeek}
                    >
                      Settimana {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-lg border",
              isValidRange
                ? "bg-primary/5 border-primary/20"
                : "bg-destructive/5 border-destructive/20"
            )}
          >
            <Badge variant={isValidRange ? "default" : "destructive"}>
              {weekCount} settiman{weekCount === 1 ? "a" : "e"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              da S{startWeek + 1} a S{endWeek + 1}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !isValidRange || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
