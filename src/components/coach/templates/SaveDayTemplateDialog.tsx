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
import { Loader2, Bookmark, Dumbbell } from "lucide-react";
import type { ProgramExercise } from "@/components/coach/WeekGrid";

interface SaveDayTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: ProgramExercise[];
  dayName: string;
  onSave: (data: { name: string; description: string; tags: string[] }) => Promise<void>;
  isLoading?: boolean;
}

export function SaveDayTemplateDialog({
  open,
  onOpenChange,
  exercises,
  dayName,
  onSave,
  isLoading,
}: SaveDayTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const filledExercises = exercises.filter((e) => !e.isEmpty);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setTagsInput("");
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    await onSave({ name: name.trim(), description: description.trim(), tags });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Salva come Template
          </DialogTitle>
          <DialogDescription>
            Salva l'allenamento di {dayName} come template riutilizzabile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {filledExercises.length} esercizi
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {filledExercises.slice(0, 5).map((ex) => (
                <Badge key={ex.id} variant="secondary" className="text-xs">
                  {ex.name}
                </Badge>
              ))}
              {filledExercises.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{filledExercises.length - 5} altri
                </Badge>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome del template *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Leg Day Ipertrofia"
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Descrizione</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opzionale: descrivi l'allenamento..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="template-tags">Tag (separati da virgola)</Label>
            <Input
              id="template-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Es: gambe, ipertrofia, avanzato"
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || filledExercises.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 mr-2" />
                Salva Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
