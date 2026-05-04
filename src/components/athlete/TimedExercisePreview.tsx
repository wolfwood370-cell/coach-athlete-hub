import { ArrowLeft, Timer, Play, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimedExercisePreviewProps {
  phaseLabel: string;
  exerciseLabel: string;
  exerciseName: string;
  videoUrl?: string;
  videoThumbnail?: string;
  targetSets: number;
  durationSeconds: number;
  loadLabel?: string;
  coachNote?: string;
  onBack?: () => void;
  onStart: () => void;
  onPlayVideo?: () => void;
}

export function TimedExercisePreview({
  phaseLabel,
  exerciseLabel,
  exerciseName,
  videoUrl,
  videoThumbnail,
  targetSets,
  durationSeconds,
  loadLabel = "Bodyweight",
  coachNote,
  onBack,
  onStart,
  onPlayVideo,
}: TimedExercisePreviewProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={onBack} className="text-primary" aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-base font-semibold text-primary">
            Training Overview
          </h1>
          <div className="h-9 w-9 rounded-full bg-muted" />
        </div>
      </header>

      {/* Card */}
      <main className="flex-1 px-4 py-5 pb-32">
        <div className="bg-background rounded-3xl border p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground leading-snug">
              {phaseLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-full">
              <Timer className="h-3.5 w-3.5" />
              Isometria a Tempo
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {exerciseLabel}
            </span>
            <h2 className="font-display text-2xl font-bold mt-1">{exerciseName}</h2>
          </div>

          {/* Video */}
          <button
            onClick={onPlayVideo}
            className="relative block w-full aspect-video rounded-2xl overflow-hidden bg-primary/10 group"
          >
            {videoThumbnail && (
              <img
                src={videoThumbnail}
                alt={exerciseName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-background/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                <Play className="h-6 w-6 text-primary fill-current ml-1" />
              </div>
            </div>
          </button>

          {/* Stats */}
          <div className="bg-muted/40 rounded-2xl p-4 divide-y">
            <div className="pb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Target
              </div>
              <div className="font-display text-lg font-semibold mt-0.5">
                {targetSets} Serie
              </div>
            </div>
            <div className="py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Durata
              </div>
              <div className="font-display text-lg font-bold text-primary mt-0.5">
                {durationSeconds} Secondi
              </div>
            </div>
            <div className="pt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sovraccarico
              </div>
              <div className="font-display text-lg font-semibold mt-0.5">
                {loadLabel}
              </div>
            </div>
          </div>

          {/* Coach Note */}
          {coachNote && (
            <div className="flex gap-3 border-l-2 border-primary bg-primary/5 rounded-r-xl px-3 py-2.5">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm italic text-foreground/80 leading-relaxed">
                {coachNote}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={onStart}
          className="w-full h-14 rounded-full text-sm font-bold uppercase tracking-wider gap-2"
        >
          Start Session
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
