import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpDown,
  MessageSquare,
  Eye,
  ClipboardList,
  MoreHorizontal,
  Filter,
  AlertTriangle,
  TrendingDown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { AcwrZone } from "@/lib/math/trainingMetrics";

// ── Types ──────────────────────────────────────────────────────────────

type AthleteStatus = "active" | "onboarding" | "injured";

export interface RiskTableAthlete {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: AthleteStatus;
  acwr: number | null;
  acwrZone: AcwrZone;
  compliance30d: number; // 0-100
  lastLoginAt: string | null; // ISO date
}

type SortField = "name" | "acwr" | "compliance30d" | "lastLoginAt";
type SortDir = "asc" | "desc";
type QuickFilter = "all" | "high-risk" | "low-compliance" | "disengaged";

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_ATHLETES: RiskTableAthlete[] = [
  {
    id: "mock-1",
    name: "Marco Rossi",
    avatarUrl: null,
    status: "active",
    acwr: 1.62,
    acwrZone: "high-risk",
    compliance30d: 92,
    lastLoginAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "mock-2",
    name: "Elena Bianchi",
    avatarUrl: null,
    status: "active",
    acwr: 1.08,
    acwrZone: "optimal",
    compliance30d: 88,
    lastLoginAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: "mock-3",
    name: "Luca Ferrari",
    avatarUrl: null,
    status: "injured",
    acwr: 0.55,
    acwrZone: "detraining",
    compliance30d: 40,
    lastLoginAt: new Date(Date.now() - 10 * 24 * 3600_000).toISOString(),
  },
  {
    id: "mock-4",
    name: "Giulia Conti",
    avatarUrl: null,
    status: "active",
    acwr: 1.45,
    acwrZone: "warning",
    compliance30d: 75,
    lastLoginAt: new Date(Date.now() - 1 * 24 * 3600_000).toISOString(),
  },
  {
    id: "mock-5",
    name: "Andrea Moretti",
    avatarUrl: null,
    status: "onboarding",
    acwr: null,
    acwrZone: "insufficient-data",
    compliance30d: 0,
    lastLoginAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
  },
  {
    id: "mock-6",
    name: "Sara Colombo",
    avatarUrl: null,
    status: "active",
    acwr: 0.72,
    acwrZone: "detraining",
    compliance30d: 55,
    lastLoginAt: new Date(Date.now() - 8 * 24 * 3600_000).toISOString(),
  },
  {
    id: "mock-7",
    name: "Davide Romano",
    avatarUrl: null,
    status: "active",
    acwr: 1.15,
    acwrZone: "optimal",
    compliance30d: 95,
    lastLoginAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: "mock-8",
    name: "Francesca Ricci",
    avatarUrl: null,
    status: "active",
    acwr: 1.55,
    acwrZone: "high-risk",
    compliance30d: 30,
    lastLoginAt: new Date(Date.now() - 12 * 24 * 3600_000).toISOString(),
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAcwrBadge(zone: AcwrZone, ratio: number | null) {
  const display = ratio !== null ? ratio.toFixed(2) : "—";
  switch (zone) {
    case "optimal":
      return (
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20 font-mono text-xs">
          {display}
        </Badge>
      );
    case "warning":
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20 font-mono text-xs">
          {display}
        </Badge>
      );
    case "high-risk":
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20 font-mono text-xs">
          ⚠ {display}
        </Badge>
      );
    case "detraining":
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20 font-mono text-xs">
          ↓ {display}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="font-mono text-xs text-muted-foreground">
          {display}
        </Badge>
      );
  }
}

function getStatusBadge(status: AthleteStatus) {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-[10px] border-success/40 text-success">Active</Badge>;
    case "onboarding":
      return <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Onboarding</Badge>;
    case "injured":
      return <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">Injured</Badge>;
  }
}

function formatLastLogin(dateStr: string | null): { text: string; isStale: boolean } {
  if (!dateStr) return { text: "Mai", isStale: true };
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (hours < 1) return { text: "Ora", isStale: false };
  if (hours < 24) return { text: `${hours}h fa`, isStale: false };
  if (days < 7) return { text: `${days}g fa`, isStale: false };
  return { text: `${days}g fa`, isStale: true };
}

// ── Filter configs ─────────────────────────────────────────────────────

const FILTERS: { key: QuickFilter; label: string; icon: typeof Filter }[] = [
  { key: "all", label: "Tutti", icon: Filter },
  { key: "high-risk", label: "High Risk", icon: AlertTriangle },
  { key: "low-compliance", label: "Low Compliance", icon: TrendingDown },
  { key: "disengaged", label: "Disengaged", icon: Shield },
];

// ── Component ──────────────────────────────────────────────────────────

interface RiskTableProps {
  athletes?: RiskTableAthlete[];
}

export function RiskTable({ athletes: externalAthletes }: RiskTableProps) {
  const navigate = useNavigate();
  const athletes = externalAthletes ?? MOCK_ATHLETES;

  const [sortField, setSortField] = useState<SortField>("acwr");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<QuickFilter>("all");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = [...athletes];

    switch (filter) {
      case "high-risk":
        list = list.filter(
          (a) => a.acwrZone === "high-risk" || a.acwrZone === "detraining"
        );
        break;
      case "low-compliance":
        list = list.filter((a) => a.compliance30d < 60);
        break;
      case "disengaged":
        list = list.filter((a) => {
          if (!a.lastLoginAt) return true;
          return Date.now() - new Date(a.lastLoginAt).getTime() > 7 * 86_400_000;
        });
        break;
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "acwr":
          cmp = (a.acwr ?? -1) - (b.acwr ?? -1);
          break;
        case "compliance30d":
          cmp = a.compliance30d - b.compliance30d;
          break;
        case "lastLoginAt":
          cmp =
            new Date(a.lastLoginAt ?? 0).getTime() -
            new Date(b.lastLoginAt ?? 0).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [athletes, filter, sortField, sortDir]);

  // Macro metrics
  const totalActive = athletes.length;
  const actionNeeded = athletes.filter(
    (a) => a.acwrZone === "high-risk" || a.compliance30d < 60 || a.status === "injured"
  ).length;
  const highRiskPct =
    totalActive > 0
      ? Math.round(
          (athletes.filter(
            (a) => a.acwrZone === "high-risk" || a.acwrZone === "detraining"
          ).length /
            totalActive) *
            100
        )
      : 0;

  return (
    <div className="space-y-4">
      {/* ── Macro Header ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Active Clients</p>
              <p className="text-2xl font-bold tabular-nums">{totalActive}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Action Needed</p>
              <p className="text-2xl font-bold tabular-nums text-warning">{actionNeeded}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              highRiskPct > 30 ? "bg-destructive/10" : "bg-success/10"
            )}>
              <TrendingDown className={cn("h-5 w-5", highRiskPct > 30 ? "text-destructive" : "text-success")} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">High Risk Ratio</p>
              <p className={cn(
                "text-2xl font-bold tabular-nums",
                highRiskPct > 30 ? "text-destructive" : "text-success"
              )}>
                {highRiskPct}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Filters ───────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-bold">📊 Athlete Risk Overview</CardTitle>
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={filter === f.key ? "default" : "outline"}
                className={cn(
                  "h-7 text-xs px-2.5 gap-1",
                  filter === f.key && "shadow-sm"
                )}
                onClick={() => setFilter(f.key)}
              >
                <f.icon className="h-3 w-3" />
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">
                  <Button variant="ghost" size="sm" className="h-7 -ml-2 text-xs gap-1" onClick={() => toggleSort("name")}>
                    Atleta
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" size="sm" className="h-7 -ml-2 text-xs gap-1" onClick={() => toggleSort("acwr")}>
                    ACWR
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[140px]">
                  <Button variant="ghost" size="sm" className="h-7 -ml-2 text-xs gap-1" onClick={() => toggleSort("compliance30d")}>
                    Compliance 30gg
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" size="sm" className="h-7 -ml-2 text-xs gap-1" onClick={() => toggleSort("lastLoginAt")}>
                    Ultimo Login
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Nessun atleta corrisponde al filtro selezionato.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((athlete) => {
                  const login = formatLastLogin(athlete.lastLoginAt);
                  return (
                    <TableRow
                      key={athlete.id}
                      className="cursor-pointer group"
                      onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                    >
                      {/* Athlete */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={athlete.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px] bg-muted font-medium">
                              {getInitials(athlete.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{athlete.name}</span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(athlete.status)}</TableCell>

                      {/* ACWR */}
                      <TableCell>{getAcwrBadge(athlete.acwrZone, athlete.acwr)}</TableCell>

                      {/* Compliance */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={athlete.compliance30d}
                            className={cn(
                              "h-1.5 w-16",
                              athlete.compliance30d < 50 && "[&>div]:bg-destructive",
                              athlete.compliance30d >= 50 && athlete.compliance30d < 80 && "[&>div]:bg-warning",
                              athlete.compliance30d >= 80 && "[&>div]:bg-success"
                            )}
                          />
                          <span className={cn(
                            "text-xs tabular-nums font-medium",
                            athlete.compliance30d < 50 ? "text-destructive" :
                            athlete.compliance30d < 80 ? "text-warning" : "text-muted-foreground"
                          )}>
                            {athlete.compliance30d}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Last Login */}
                      <TableCell>
                        <span className={cn(
                          "text-xs",
                          login.isStale ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                          {login.text}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/coach/messages`); }}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Messaggio
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/coach/athlete/${athlete.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Vedi Programma
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/coach/athlete/${athlete.id}`); }}>
                              <ClipboardList className="h-4 w-4 mr-2" />
                              Quick Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
