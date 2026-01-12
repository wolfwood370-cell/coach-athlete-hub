import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Calendar,
  Dumbbell,
  Target,
  Zap,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addWeeks, startOfWeek, differenceInWeeks, addMonths, isSameWeek } from "date-fns";
import { it } from "date-fns/locale";
import { Line, XAxis, YAxis, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { toast } from "sonner";

// ============================================
// PHASE TYPES & CONFIGURATION
// ============================================

type PhaseType = "hypertrophy" | "strength" | "power" | "deload" | "peaking" | "transition";

interface PhaseConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Dumbbell;
  volumeMultiplier: number; // Relative volume for visualization
}

const PHASE_CONFIG: Record<PhaseType, PhaseConfig> = {
  hypertrophy: {
    label: "Ipertrofia",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    icon: Dumbbell,
    volumeMultiplier: 1.0,
  },
  strength: {
    label: "Forza",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
    icon: Target,
    volumeMultiplier: 0.85,
  },
  power: {
    label: "Potenza",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
    icon: Zap,
    volumeMultiplier: 0.7,
  },
  deload: {
    label: "Scarico",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
    icon: Activity,
    volumeMultiplier: 0.4,
  },
  peaking: {
    label: "Picco",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
    icon: Flame,
    volumeMultiplier: 0.6,
  },
  transition: {
    label: "Transizione",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/20",
    borderColor: "border-slate-500/50",
    icon: TrendingUp,
    volumeMultiplier: 0.5,
  },
};

// ============================================
// BLOCK INTERFACE
// ============================================

interface TrainingBlock {
  id: string;
  name: string;
  phase: PhaseType;
  startWeek: number; // Week offset from start date
  durationWeeks: number;
  baseVolume: number; // Base volume units (arbitrary)
  notes?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate weeks array for timeline
function generateWeeksArray(startDate: Date, totalWeeks: number): Date[] {
  return Array.from({ length: totalWeeks }, (_, i) => addWeeks(startDate, i));
}

// Calculate volume data for overlay chart
function calculateVolumeData(
  blocks: TrainingBlock[],
  totalWeeks: number,
  baseVolume: number = 100
): Array<{ week: number; volume: number; phase: PhaseType | null }> {
  return Array.from({ length: totalWeeks }, (_, weekIndex) => {
    const block = blocks.find(
      b => weekIndex >= b.startWeek && weekIndex < b.startWeek + b.durationWeeks
    );
    
    if (!block) {
      return { week: weekIndex + 1, volume: 0, phase: null };
    }
    
    const config = PHASE_CONFIG[block.phase];
    return {
      week: weekIndex + 1,
      volume: Math.round(block.baseVolume * config.volumeMultiplier),
      phase: block.phase,
    };
  });
}

// ============================================
// BLOCK COMPONENT
// ============================================

function BlockBar({
  block,
  weekWidth,
  onEdit,
  onDelete,
  onClick,
}: {
  block: TrainingBlock;
  weekWidth: number;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const config = PHASE_CONFIG[block.phase];
  const Icon = config.icon;
  const width = block.durationWeeks * weekWidth - 8;
  const left = block.startWeek * weekWidth + 4;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-2 h-14 rounded-lg border-2 cursor-pointer transition-all",
              "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
              config.bgColor,
              config.borderColor
            )}
            style={{ left, width }}
            onClick={onClick}
          >
            <div className="h-full flex items-center gap-2 px-3">
              <Icon className={cn("h-5 w-5 flex-shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", config.color)}>
                  {block.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {block.durationWeeks} settimane
                </p>
              </div>
              
              {/* Action buttons (visible on hover via group) */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1 rounded hover:bg-white/20"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1 rounded hover:bg-destructive/20 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{block.name}</p>
          <p className="text-xs text-muted-foreground">
            {config.label} · {block.durationWeeks} settimane · Vol: {block.baseVolume}
          </p>
          {block.notes && (
            <p className="text-xs mt-1 max-w-[200px]">{block.notes}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Periodization() {
  const navigate = useNavigate();
  const TOTAL_WEEKS = 26; // 6 months
  const WEEK_WIDTH = 56; // pixels per week
  
  // Start from current week
  const [startDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weeks = useMemo(() => generateWeeksArray(startDate, TOTAL_WEEKS), [startDate]);
  
  // Blocks state
  const [blocks, setBlocks] = useState<TrainingBlock[]>([
    {
      id: generateBlockId(),
      name: "Accumulo Volume",
      phase: "hypertrophy",
      startWeek: 0,
      durationWeeks: 4,
      baseVolume: 100,
    },
    {
      id: generateBlockId(),
      name: "Intensificazione",
      phase: "strength",
      startWeek: 4,
      durationWeeks: 4,
      baseVolume: 90,
    },
    {
      id: generateBlockId(),
      name: "Scarico Attivo",
      phase: "deload",
      startWeek: 8,
      durationWeeks: 1,
      baseVolume: 100,
    },
    {
      id: generateBlockId(),
      name: "Potenza Esplosiva",
      phase: "power",
      startWeek: 9,
      durationWeeks: 3,
      baseVolume: 85,
    },
    {
      id: generateBlockId(),
      name: "Picco Prestazione",
      phase: "peaking",
      startWeek: 12,
      durationWeeks: 2,
      baseVolume: 80,
    },
  ]);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TrainingBlock | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phase: "hypertrophy" as PhaseType,
    startWeek: 0,
    durationWeeks: 4,
    baseVolume: 100,
    notes: "",
  });

  // Calculate volume data for chart overlay
  const volumeData = useMemo(
    () => calculateVolumeData(blocks, TOTAL_WEEKS, 100),
    [blocks]
  );

  // Find current week
  const currentWeekIndex = differenceInWeeks(new Date(), startDate);

  // Handlers
  const handleAddBlock = () => {
    // Find first available slot
    const occupiedWeeks = new Set<number>();
    blocks.forEach(b => {
      for (let w = b.startWeek; w < b.startWeek + b.durationWeeks; w++) {
        occupiedWeeks.add(w);
      }
    });
    
    let firstFree = 0;
    while (occupiedWeeks.has(firstFree) && firstFree < TOTAL_WEEKS) {
      firstFree++;
    }
    
    setFormData({
      name: "",
      phase: "hypertrophy",
      startWeek: firstFree,
      durationWeeks: 4,
      baseVolume: 100,
      notes: "",
    });
    setEditingBlock(null);
    setDialogOpen(true);
  };

  const handleEditBlock = (block: TrainingBlock) => {
    setFormData({
      name: block.name,
      phase: block.phase,
      startWeek: block.startWeek,
      durationWeeks: block.durationWeeks,
      baseVolume: block.baseVolume,
      notes: block.notes || "",
    });
    setEditingBlock(block);
    setDialogOpen(true);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    toast.success("Blocco eliminato");
  };

  const handleSaveBlock = () => {
    if (!formData.name.trim()) {
      toast.error("Inserisci un nome per il blocco");
      return;
    }

    if (editingBlock) {
      // Update existing
      setBlocks(prev =>
        prev.map(b =>
          b.id === editingBlock.id
            ? { ...b, ...formData }
            : b
        )
      );
      toast.success("Blocco aggiornato");
    } else {
      // Add new
      setBlocks(prev => [
        ...prev,
        {
          id: generateBlockId(),
          ...formData,
        },
      ]);
      toast.success("Blocco aggiunto");
    }

    setDialogOpen(false);
  };

  const handleBlockClick = (block: TrainingBlock) => {
    // Navigate to ProgramBuilder with block focus
    const config = PHASE_CONFIG[block.phase];
    navigate(`/coach/builder?focus=${block.phase}&blockName=${encodeURIComponent(block.name)}`);
    toast.info(`Programmazione: ${block.name} (${config.label})`);
  };

  return (
    <CoachLayout title="Periodizzazione" subtitle="Macro-view del ciclo annuale">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Piano di Periodizzazione</h1>
            <p className="text-sm text-muted-foreground">
              Visualizzazione a 6 mesi · {format(startDate, "MMM yyyy", { locale: it })} - {format(addMonths(startDate, 6), "MMM yyyy", { locale: it })}
            </p>
          </div>
          <Button onClick={handleAddBlock} className="gap-2 gradient-primary">
            <Plus className="h-4 w-4" />
            Aggiungi Blocco
          </Button>
        </div>

        {/* Phase Legend */}
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              {Object.entries(PHASE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className={cn("gap-1.5 px-3 py-1", config.bgColor, config.color)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gantt Timeline */}
        <Card className="border-0 overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div style={{ width: TOTAL_WEEKS * WEEK_WIDTH + 60 }}>
                {/* Month Headers */}
                <div className="flex border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                  <div className="w-[60px] flex-shrink-0 p-2 border-r border-border/50">
                    <span className="text-xs text-muted-foreground">Mese</span>
                  </div>
                  {Array.from({ length: 7 }).map((_, monthIndex) => {
                    const monthDate = addMonths(startDate, monthIndex);
                    const weeksInMonth = monthIndex === 0 ? 4 : 4;
                    return (
                      <div
                        key={monthIndex}
                        className="border-r border-border/50 p-2"
                        style={{ width: weeksInMonth * WEEK_WIDTH }}
                      >
                        <span className="text-xs font-medium">
                          {format(monthDate, "MMMM yyyy", { locale: it })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Week Headers */}
                <div className="flex border-b border-border/50 bg-muted/30">
                  <div className="w-[60px] flex-shrink-0 p-2 border-r border-border/50">
                    <span className="text-[10px] text-muted-foreground">Sett.</span>
                  </div>
                  {weeks.map((week, i) => {
                    const isCurrentWeek = i === currentWeekIndex;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "border-r border-border/30 p-1 text-center",
                          isCurrentWeek && "bg-primary/10"
                        )}
                        style={{ width: WEEK_WIDTH }}
                      >
                        <span className={cn(
                          "text-[10px]",
                          isCurrentWeek ? "font-bold text-primary" : "text-muted-foreground"
                        )}>
                          {i + 1}
                        </span>
                        <p className="text-[9px] text-muted-foreground/60">
                          {format(week, "d/M")}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Blocks Row */}
                <div className="relative border-b border-border/50" style={{ height: 72 }}>
                  {/* Row label */}
                  <div className="absolute left-0 top-0 w-[60px] h-full flex items-center justify-center border-r border-border/50 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground font-medium">Blocchi</span>
                  </div>
                  
                  {/* Current week indicator */}
                  {currentWeekIndex >= 0 && currentWeekIndex < TOTAL_WEEKS && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                      style={{ left: 60 + currentWeekIndex * WEEK_WIDTH + WEEK_WIDTH / 2 }}
                    />
                  )}
                  
                  {/* Block bars */}
                  <div className="absolute top-0 left-[60px] right-0 bottom-0">
                    {blocks.map(block => (
                      <BlockBar
                        key={block.id}
                        block={block}
                        weekWidth={WEEK_WIDTH}
                        onEdit={() => handleEditBlock(block)}
                        onDelete={() => handleDeleteBlock(block.id)}
                        onClick={() => handleBlockClick(block)}
                      />
                    ))}
                  </div>
                </div>

                {/* Volume Overlay Chart */}
                <div className="relative" style={{ height: 120 }}>
                  {/* Row label */}
                  <div className="absolute left-0 top-0 w-[60px] h-full flex items-center justify-center border-r border-border/50 bg-muted/20 z-10">
                    <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
                      Volume<br/>Pianificato
                    </span>
                  </div>
                  
                  {/* Chart */}
                  <div className="absolute left-[60px] right-0 top-0 bottom-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <XAxis dataKey="week" hide />
                        <YAxis domain={[0, 120]} hide />
                        <defs>
                          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#volumeGradient)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{blocks.length}</p>
              <p className="text-xs text-muted-foreground">Blocchi Totali</p>
            </CardContent>
          </Card>
          <Card className="border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">
                {blocks.reduce((sum, b) => sum + b.durationWeeks, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Settimane Pianificate</p>
            </CardContent>
          </Card>
          <Card className="border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">
                {blocks.filter(b => b.phase === "deload").length}
              </p>
              <p className="text-xs text-muted-foreground">Scarichi Previsti</p>
            </CardContent>
          </Card>
          <Card className="border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">
                {Math.round(blocks.reduce((sum, b) => sum + b.baseVolume * PHASE_CONFIG[b.phase].volumeMultiplier, 0) / blocks.length) || 0}
              </p>
              <p className="text-xs text-muted-foreground">Volume Medio</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Block Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {editingBlock ? "Modifica Blocco" : "Nuovo Blocco"}
            </DialogTitle>
            <DialogDescription>
              Definisci le caratteristiche del blocco di allenamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Blocco</Label>
              <Input
                placeholder="es. Accumulo Volume"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Fase</Label>
              <Select
                value={formData.phase}
                onValueChange={(value: PhaseType) => setFormData(prev => ({ ...prev, phase: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PHASE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Settimana Inizio</Label>
                <Input
                  type="number"
                  min={0}
                  max={TOTAL_WEEKS - 1}
                  value={formData.startWeek}
                  onChange={(e) => setFormData(prev => ({ ...prev, startWeek: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Durata (settimane)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationWeeks: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Volume Base (unità)</Label>
              <Input
                type="number"
                min={50}
                max={150}
                value={formData.baseVolume}
                onChange={(e) => setFormData(prev => ({ ...prev, baseVolume: parseInt(e.target.value) || 100 }))}
              />
              <p className="text-xs text-muted-foreground">
                Volume effettivo: {Math.round(formData.baseVolume * PHASE_CONFIG[formData.phase].volumeMultiplier)} (×{PHASE_CONFIG[formData.phase].volumeMultiplier})
              </p>
            </div>

            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Input
                placeholder="Note aggiuntive..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveBlock} className="gradient-primary">
              {editingBlock ? "Salva Modifiche" : "Aggiungi Blocco"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
}
