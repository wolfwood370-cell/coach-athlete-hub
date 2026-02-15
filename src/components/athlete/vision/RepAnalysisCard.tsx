import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, TrendingUp, Ruler } from "lucide-react";
import type { TrackingResult } from "@/hooks/useBarbellTracker";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface RepAnalysisCardProps {
  result: TrackingResult;
}

const chartConfig = {
  velocity: { label: "Velocità (m/s)", color: "hsl(var(--primary))" },
};

export function RepAnalysisCard({ result }: RepAnalysisCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw bar path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || result.points.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pts = result.points;
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 20;
    const scale = Math.min((w - pad * 2) / rangeX, (h - pad * 2) / rangeY);

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "hsl(var(--muted) / 0.3)";
    ctx.fillRect(0, 0, w, h);

    // Ideal vertical line (dashed)
    const centerX = pad + ((pts[0].x - minX) * scale);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "hsl(var(--muted-foreground) / 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, pad);
    ctx.lineTo(centerX, h - pad);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bar path
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    pts.forEach((pt, i) => {
      const px = pad + (pt.x - minX) * scale;
      const py = pad + (pt.y - minY) * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Start/end dots
    const drawDot = (pt: typeof pts[0], color: string) => {
      const px = pad + (pt.x - minX) * scale;
      const py = pad + (pt.y - minY) * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    };
    drawDot(pts[0], "hsl(var(--chart-4))");
    drawDot(pts[pts.length - 1], "hsl(var(--destructive))");
  }, [result.points]);

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <Gauge className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-[10px] text-muted-foreground">Velocità Media</p>
            <p className="text-lg font-bold tabular-nums">{result.avgVelocityMs}</p>
            <p className="text-[10px] text-muted-foreground">m/s</p>
          </CardContent>
        </Card>
        <Card className="bg-chart-4/5 border-chart-4/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-chart-4" />
            <p className="text-[10px] text-muted-foreground">Picco</p>
            <p className="text-lg font-bold tabular-nums">{result.peakVelocityMs}</p>
            <p className="text-[10px] text-muted-foreground">m/s</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary border-secondary/50">
          <CardContent className="p-3 text-center">
            <Ruler className="h-4 w-4 mx-auto mb-1 text-secondary-foreground" />
            <p className="text-[10px] text-muted-foreground">ROM</p>
            <p className="text-lg font-bold tabular-nums">{result.romCm}</p>
            <p className="text-[10px] text-muted-foreground">cm</p>
          </CardContent>
        </Card>
      </div>

      {/* Velocity Chart */}
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Velocità nel Tempo</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <LineChart data={result.velocityProfile}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="time"
                tickFormatter={(v: number) => `${v.toFixed(1)}s`}
                className="text-[10px]"
              />
              <YAxis
                domain={[0, "auto"]}
                tickFormatter={(v: number) => `${v}`}
                className="text-[10px]"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="velocity"
                stroke="var(--color-velocity)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bar Path Canvas */}
      <Card>
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Traiettoria Bilanciere</CardTitle>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="h-4 text-[9px] gap-1">
                <span className="w-2 h-2 rounded-full bg-chart-4 inline-block" /> Inizio
              </Badge>
              <Badge variant="outline" className="h-4 text-[9px] gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Fine
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2 flex justify-center">
          <canvas
            ref={canvasRef}
            width={200}
            height={260}
            className="rounded-lg border border-border/50"
          />
        </CardContent>
      </Card>
    </div>
  );
}
