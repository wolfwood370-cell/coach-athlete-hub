import { useState, useRef } from "react";
import { X, HelpCircle, Minus, Plus, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WeeklyCheckInProps {
  onClose?: () => void;
  onSubmit?: (data: {
    bodyweight: number;
    frontPhoto: File | null;
    backPhoto: File | null;
    notes: string;
  }) => void;
  initialBodyweight?: number;
}

interface PhotoSlotProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

function PhotoSlot({ label, file, onChange }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="relative flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden"
    >
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Tap to add</p>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}

export function WeeklyCheckIn({
  onClose,
  onSubmit,
  initialBodyweight = 75.5,
}: WeeklyCheckInProps) {
  const [bodyweight, setBodyweight] = useState(initialBodyweight);
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const adjust = (delta: number) =>
    setBodyweight((w) => Math.max(0, Math.round((w + delta) * 10) / 10));

  const handleSubmit = () => {
    onSubmit?.({ bodyweight, frontPhoto, backPhoto, notes });
  };

  return (
    <div className="flex flex-col h-full bg-secondary/30 font-['Inter']">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 flex items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-primary font-['Manrope']">
            Weekly Check-in
          </h1>
          <button
            aria-label="Help"
            className="h-10 w-10 flex items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Scroll Body */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground font-['Manrope'] tracking-tight">
            Weekly Check-in
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's review your progress from the past 7 days.
          </p>
        </div>

        {/* Bodyweight Card */}
        <section className="rounded-2xl bg-card p-5 shadow-sm mb-5">
          <h3 className="text-lg font-semibold text-foreground font-['Manrope'] mb-4">
            Bodyweight
          </h3>
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjust(-0.1)}
              aria-label="Decrease"
              className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground font-['Manrope'] tabular-nums">
                {bodyweight.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">kg</span>
            </div>
            <button
              onClick={() => adjust(0.1)}
              aria-label="Increase"
              className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Physique Update */}
        <section className="rounded-2xl bg-card p-5 shadow-sm mb-5">
          <h3 className="text-lg font-semibold text-foreground font-['Manrope'] mb-4">
            Physique Update
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <PhotoSlot label="Front" file={frontPhoto} onChange={setFrontPhoto} />
            <PhotoSlot label="Back" file={backPhoto} onChange={setBackPhoto} />
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl bg-card p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground font-['Manrope'] mb-4">
            How did this week feel?
          </h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any struggles with hunger, fatigue, or the training volume?..."
            className="min-h-[120px] resize-none bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </section>
      </main>

      {/* Sticky Submit */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-6 bg-gradient-to-t from-background via-background to-transparent"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full h-14 rounded-full text-base font-semibold font-['Manrope'] shadow-lg"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit to Coach
        </Button>
      </div>
    </div>
  );
}

export default WeeklyCheckIn;
