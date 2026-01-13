import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addWeeks, startOfWeek, differenceInWeeks } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCoachData } from "@/hooks/useCoachData";
import { usePeriodization, TrainingPhase, PhaseFocusType, CreatePhaseInput } from "@/hooks/usePeriodization";
import { MacroTimeline, PHASE_CONFIG } from "@/components/coach/MacroTimeline";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================
// MAIN COMPONENT
// ============================================

export default function Periodization() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { athletes, isLoading: loadingAthletes } = useCoachData();
  
  // Selected athlete state
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  
  // Periodization hook
  const {
    phases,
    isLoading: loadingPhases,
    createPhase,
    updatePhase,
    deletePhase,
    isCreating,
    isUpdating,
    checkOverlap,
  } = usePeriodization(selectedAthleteId);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<TrainingPhase | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    focus_type: "hypertrophy" as PhaseFocusType,
    start_date: "",
    end_date: "",
    base_volume: 100,
    notes: "",
  });
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  // Stats calculated from phases
  const stats = useMemo(() => {
    const totalWeeks = phases.reduce((sum, p) => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return sum + Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    }, 0);
    
    const recoveryPhases = phases.filter(p => p.focus_type === "recovery").length;
    const strengthPhases = phases.filter(p => p.focus_type === "strength" || p.focus_type === "power").length;
    
    return {
      totalPhases: phases.length,
      totalWeeks,
      recoveryPhases,
      strengthPhases,
    };
  }, [phases]);

  // Handlers
  const handleAthleteChange = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
  };

  const handleAddPhase = (clickedDate?: Date) => {
    const startDate = clickedDate || new Date();
    const endDate = addWeeks(startDate, 4);
    
    setFormData({
      name: "",
      focus_type: "hypertrophy",
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      base_volume: 100,
      notes: "",
    });
    setEditingPhase(null);
    setOverlapWarning(null);
    setDialogOpen(true);
  };

  const handleEditPhase = (phase: TrainingPhase) => {
    setFormData({
      name: phase.name,
      focus_type: phase.focus_type,
      start_date: phase.start_date,
      end_date: phase.end_date,
      base_volume: phase.base_volume,
      notes: phase.notes || "",
    });
    setEditingPhase(phase);
    setOverlapWarning(null);
    setDialogOpen(true);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (confirm("Sei sicuro di voler eliminare questa fase?")) {
      await deletePhase(phaseId);
    }
  };

  const handlePhaseClick = (phase: TrainingPhase) => {
    const config = PHASE_CONFIG[phase.focus_type];
    navigate(`/coach/builder?focus=${phase.focus_type}&blockName=${encodeURIComponent(phase.name)}`);
    toast.info(`Programmazione: ${phase.name} (${config.label})`);
  };

  const validateAndCheckOverlap = () => {
    if (!formData.start_date || !formData.end_date) return true;
    
    const result = checkOverlap({
      id: editingPhase?.id,
      start_date: formData.start_date,
      end_date: formData.end_date,
    }, phases);
    
    if (result.hasOverlap) {
      const conflictNames = result.conflictingPhases.map(p => p.name).join(", ");
      setOverlapWarning(`Date in conflitto con: ${conflictNames}`);
      return false;
    }
    
    setOverlapWarning(null);
    return true;
  };

  const handleSavePhase = async () => {
    if (!formData.name.trim()) {
      toast.error("Inserisci un nome per la fase");
      return;
    }

    if (!selectedAthleteId) {
      toast.error("Seleziona un atleta");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error("Inserisci le date di inizio e fine");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error("La data di fine deve essere successiva alla data di inizio");
      return;
    }

    if (!validateAndCheckOverlap()) {
      return;
    }

    try {
      if (editingPhase) {
        await updatePhase({
          id: editingPhase.id,
          name: formData.name,
          focus_type: formData.focus_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          base_volume: formData.base_volume,
          notes: formData.notes || undefined,
        });
      } else {
        await createPhase({
          athlete_id: selectedAthleteId,
          name: formData.name,
          focus_type: formData.focus_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          base_volume: formData.base_volume,
          notes: formData.notes || undefined,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  return (
    <CoachLayout title="Periodizzazione" subtitle="Pianificazione macro dei mesocicli">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Macro-Periodization Planner</h1>
            <p className="text-sm text-muted-foreground">
              Progetta i blocchi di allenamento a lungo termine
            </p>
          </div>
          <Button 
            onClick={() => handleAddPhase()} 
            className="gap-2 gradient-primary"
            disabled={!selectedAthleteId}
          >
            <Plus className="h-4 w-4" />
            Nuova Fase
          </Button>
        </div>

        {/* Athlete Selector */}
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <Label className="text-sm font-medium">Atleta:</Label>
              </div>
              <Select
                value={selectedAthleteId || ""}
                onValueChange={handleAthleteChange}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Seleziona un atleta..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingAthletes ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : athletes.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nessun atleta assegnato
                    </div>
                  ) : (
                    athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-primary">
                              {athlete.full_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <span>{athlete.full_name || "Atleta"}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedAthlete && (
                <Badge variant="secondary" className="ml-2">
                  {phases.length} {phases.length === 1 ? "fase" : "fasi"} pianificate
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {!selectedAthleteId ? (
          <Card className="border-0">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Seleziona un Atleta</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Scegli un atleta dal menu sopra per visualizzare e gestire il suo piano di periodizzazione annuale.
              </p>
            </CardContent>
          </Card>
        ) : loadingPhases ? (
          <Card className="border-0">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Caricamento fasi...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Timeline */}
            <MacroTimeline
              phases={phases}
              athleteId={selectedAthleteId}
              onAddPhase={handleAddPhase}
              onEditPhase={handleEditPhase}
              onDeletePhase={handleDeletePhase}
              onPhaseClick={handlePhaseClick}
              months={12}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-0">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{stats.totalPhases}</p>
                  <p className="text-xs text-muted-foreground">Fasi Totali</p>
                </CardContent>
              </Card>
              <Card className="border-0">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-500">{stats.totalWeeks}</p>
                  <p className="text-xs text-muted-foreground">Settimane Pianificate</p>
                </CardContent>
              </Card>
              <Card className="border-0">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-500">{stats.recoveryPhases}</p>
                  <p className="text-xs text-muted-foreground">Fasi di Recupero</p>
                </CardContent>
              </Card>
              <Card className="border-0">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-amber-500">{stats.strengthPhases}</p>
                  <p className="text-xs text-muted-foreground">Fasi Forza/Potenza</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Phase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {editingPhase ? "Modifica Fase" : "Nuova Fase"}
            </DialogTitle>
            <DialogDescription>
              Definisci le caratteristiche del mesociclo di allenamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {overlapWarning && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{overlapWarning}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Nome Fase</Label>
              <Input
                placeholder="es. Blocco Ipertrofia Q1"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Focus</Label>
              <Select
                value={formData.focus_type}
                onValueChange={(value: PhaseFocusType) => setFormData(prev => ({ ...prev, focus_type: value }))}
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
                <Label>Data Inizio</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, start_date: e.target.value }));
                    setOverlapWarning(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fine</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, end_date: e.target.value }));
                    setOverlapWarning(null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Volume Base (0-150)</Label>
              <Input
                type="number"
                min={50}
                max={150}
                value={formData.base_volume}
                onChange={(e) => setFormData(prev => ({ ...prev, base_volume: parseInt(e.target.value) || 100 }))}
              />
              <p className="text-xs text-muted-foreground">
                Indicatore relativo del carico di lavoro pianificato
              </p>
            </div>

            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                placeholder="Obiettivi, considerazioni, note..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSavePhase} 
              className="gradient-primary"
              disabled={isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPhase ? "Salva Modifiche" : "Crea Fase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
}
