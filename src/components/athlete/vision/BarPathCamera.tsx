import { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBarbellTracker, type TrackingResult } from "@/hooks/useBarbellTracker";
import { RepAnalysisCard } from "./RepAnalysisCard";
import { Camera, CircleDot, Square, RotateCcw, Crosshair, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarPathCameraProps {
  onResult?: (result: TrackingResult) => void;
  onClose: () => void;
}

type Phase = "setup" | "calibrating" | "ready" | "recording" | "results";

export function BarPathCamera({ onResult, onClose }: BarPathCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState<Phase>("setup");
  const [cameraReady, setCameraReady] = useState(false);

  const {
    isCalibrated,
    isTracking,
    points,
    result,
    calibrate,
    startTracking,
    processFrame,
    stopTracking,
    reset,
  } = useBarbellTracker();

  // Sync phase with hook state
  useEffect(() => {
    if (result) setPhase("results");
    else if (isTracking) setPhase("recording");
    else if (isCalibrated) setPhase("ready");
  }, [result, isTracking, isCalibrated]);

  const getImageData = useCallback((): ImageData | null => {
    const video = webcamRef.current?.video;
    if (!video || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  // Handle tap to calibrate
  const handleCanvasTap = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== "calibrating") return;

      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;
      if (!canvas || !video) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = video.videoWidth / rect.width;
      const scaleY = video.videoHeight / rect.height;
      const tapX = Math.round((e.clientX - rect.left) * scaleX);
      const tapY = Math.round((e.clientY - rect.top) * scaleY);

      const imageData = getImageData();
      if (imageData) {
        calibrate(imageData, tapX, tapY);
      }
    },
    [phase, calibrate, getImageData]
  );

  // Tracking loop via rAF
  useEffect(() => {
    if (!isTracking) return;

    const loop = () => {
      const imageData = getImageData();
      if (imageData) processFrame(imageData);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isTracking, getImageData, processFrame]);

  // Draw tracking overlay
  useEffect(() => {
    if (phase === "results" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = webcamRef.current?.video;
    if (!ctx || !video) return;

    // Only draw overlay dots, not the video (video is beneath)
    if (points.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    // We need a separate overlay canvas to not interfere with tracking
    // For simplicity, draw on the same canvas but clear and redraw each frame in the rAF above
    // Instead we'll just use CSS positioned dots — skip canvas overlay for perf
  }, [points, phase]);

  const handleReset = useCallback(() => {
    reset();
    setPhase("setup");
  }, [reset]);

  const handleRecordToggle = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  const handleSaveResult = useCallback(() => {
    if (result && onResult) {
      onResult(result);
    }
    onClose();
  }, [result, onResult, onClose]);

  const videoConstraints: MediaTrackConstraints = {
    facingMode: "environment",
    width: { ideal: 720 },
    height: { ideal: 1280 },
  };

  const phaseLabel: Record<Phase, string> = {
    setup: "Prepara la ripresa",
    calibrating: "Tocca la piastra del bilanciere",
    ready: "Pronto per registrare",
    recording: "Registrazione in corso…",
    results: "Analisi completata",
  };

  if (phase === "results" && result) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h2 className="text-base font-semibold">Analisi Ripetizione</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <RepAnalysisCard result={result} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-border/30">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Riprova
          </Button>
          <Button className="flex-1" onClick={handleSaveResult}>
            Salva Risultati
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-black">
      {/* Camera Feed */}
      <div className="relative flex-1 overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={videoConstraints}
          onUserMedia={() => setCameraReady(true)}
          className="absolute inset-0 w-full h-full object-cover"
          mirrored={false}
        />

        {/* Hidden canvas for frame processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay canvas for tap + path drawing */}
        <canvas
          className={cn(
            "absolute inset-0 w-full h-full z-10",
            phase === "calibrating" && "cursor-crosshair"
          )}
          onPointerDown={handleCanvasTap}
          style={{ touchAction: "none" }}
        />

        {/* Live tracking dots overlay */}
        {isTracking && points.length > 0 && webcamRef.current?.video && (
          <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
            <polyline
              points={points
                .slice(-60)
                .map((p) => {
                  const video = webcamRef.current?.video;
                  if (!video) return "0,0";
                  const el = video.getBoundingClientRect();
                  const sx = el.width / video.videoWidth;
                  const sy = el.height / video.videoHeight;
                  return `${p.x * sx},${p.y * sy}`;
                })
                .join(" ")}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </svg>
        )}

        {/* Status badge */}
        <div className="absolute top-4 left-0 right-0 z-30 flex justify-center">
          <Badge
            className={cn(
              "text-xs px-3 py-1 backdrop-blur-md",
              phase === "recording"
                ? "bg-destructive/80 text-destructive-foreground animate-pulse"
                : "bg-black/60 text-white border-white/20"
            )}
          >
            {phase === "recording" && (
              <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
            )}
            {phaseLabel[phase]}
          </Badge>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-30 text-white bg-black/40 hover:bg-black/60 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Calibration reticle hint */}
        {phase === "calibrating" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <Crosshair className="h-16 w-16 text-white/40 animate-pulse" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl px-4 py-5 safe-bottom">
        <div className="flex items-center justify-center gap-6">
          {phase === "setup" && (
            <Button
              onClick={() => setPhase("calibrating")}
              disabled={!cameraReady}
              className="h-14 px-6 rounded-full text-base gap-2"
            >
              <Crosshair className="h-5 w-5" /> Calibra
            </Button>
          )}

          {phase === "calibrating" && (
            <p className="text-white/70 text-sm text-center">
              Inquadra il bilanciere e tocca una piastra colorata
            </p>
          )}

          {(phase === "ready" || phase === "recording") && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 h-12 w-12"
                onClick={handleReset}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              {/* Big record/stop button */}
              <button
                onClick={handleRecordToggle}
                className={cn(
                  "h-[72px] w-[72px] rounded-full flex items-center justify-center transition-all",
                  "ring-4 ring-white/30",
                  isTracking
                    ? "bg-destructive scale-90"
                    : "bg-destructive hover:scale-105"
                )}
              >
                {isTracking ? (
                  <Square className="h-7 w-7 text-white fill-white" />
                ) : (
                  <CircleDot className="h-8 w-8 text-white" />
                )}
              </button>

              <div className="w-12" /> {/* Spacer */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
