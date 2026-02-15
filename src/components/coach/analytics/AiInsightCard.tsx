import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, RefreshCw, Copy, CheckCircle2, AlertTriangle, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface AiInsightCardProps {
  athleteId: string | undefined;
}

interface AiInsight {
  id: string;
  athlete_id: string;
  coach_id: string;
  week_start_date: string;
  insight_text: string;
  action_items: string[];
  sentiment_score: number;
  created_at: string;
}

function getSentimentConfig(score: number) {
  if (score >= 0.7) return {
    border: "border-success/50",
    bg: "bg-success/5",
    badge: "bg-success/15 text-success border-success/30",
    label: "Eccellente",
    icon: CheckCircle2,
  };
  if (score >= 0.4) return {
    border: "border-warning/50",
    bg: "bg-warning/5",
    badge: "bg-warning/15 text-warning border-warning/30",
    label: "Attenzione",
    icon: AlertTriangle,
  };
  return {
    border: "border-destructive/50",
    bg: "bg-destructive/5",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    label: "Critico",
    icon: TrendingDown,
  };
}

export function AiInsightCard({ athleteId }: AiInsightCardProps) {
  const queryClient = useQueryClient();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Fetch latest insight
  const { data: insight, isLoading } = useQuery({
    queryKey: ["ai-insight", athleteId],
    queryFn: async () => {
      if (!athleteId) return null;
      const { data, error } = await supabase
        .from("athlete_ai_insights")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AiInsight | null;
    },
    enabled: !!athleteId,
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-athlete-week", {
        body: { athlete_id: athleteId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AiInsight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insight", athleteId] });
      setCheckedItems(new Set());
      toast.success("Analisi AI generata", {
        description: "Il report settimanale è stato aggiornato.",
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Errore generazione analisi";
      toast.error("Errore AI", { description: message });
    },
  });

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiato negli appunti");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const sentiment = insight ? getSentimentConfig(insight.sentiment_score) : null;

  return (
    <Card className={cn(
      "overflow-hidden transition-colors",
      insight && sentiment ? `${sentiment.border} ${sentiment.bg}` : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Analisi AI Settimanale
                {insight && sentiment && (
                  <Badge className={cn("text-[10px] border", sentiment.badge)}>
                    {sentiment.label}
                  </Badge>
                )}
              </CardTitle>
              {insight && (
                <p className="text-xs text-muted-foreground">
                  Settimana del {format(new Date(insight.week_start_date), "d MMMM yyyy", { locale: it })}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-1.5"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {insight ? "Rigenera" : "Genera Analisi"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!insight ? (
          <div className="text-center py-8">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Nessuna analisi disponibile</p>
            <p className="text-xs text-muted-foreground">
              Clicca "Genera Analisi" per creare il report settimanale AI.
            </p>
          </div>
        ) : (
          <>
            {/* Insight Text */}
            <div className="relative">
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                "{insight.insight_text}"
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-7 w-7 opacity-50 hover:opacity-100"
                onClick={() => copyToClipboard(insight.insight_text)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Items */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Azioni Consigliate
              </p>
              {insight.action_items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-all",
                    checkedItems.has(idx)
                      ? "bg-muted/50 border-muted"
                      : "bg-background hover:border-primary/30"
                  )}
                >
                  <Checkbox
                    checked={checkedItems.has(idx)}
                    onCheckedChange={() => toggleItem(idx)}
                    className="shrink-0"
                  />
                  <span className={cn(
                    "text-sm flex-1",
                    checkedItems.has(idx) && "line-through text-muted-foreground"
                  )}>
                    {item}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-40 hover:opacity-100"
                    onClick={() => copyToClipboard(item)}
                    title="Copia nel messaggio"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Sentiment bar */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Sentiment</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    insight.sentiment_score >= 0.7 && "bg-success",
                    insight.sentiment_score >= 0.4 && insight.sentiment_score < 0.7 && "bg-warning",
                    insight.sentiment_score < 0.4 && "bg-destructive"
                  )}
                  style={{ width: `${insight.sentiment_score * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {(insight.sentiment_score * 100).toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
