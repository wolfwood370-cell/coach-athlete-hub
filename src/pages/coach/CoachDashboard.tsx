import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  TrendingUp, 
  ClipboardCheck,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
  Activity,
  Dumbbell,
  Camera,
  MessageSquare,
  Scale,
  HeartPulse,
  Ban,
  Clock
} from "lucide-react";

// Mock Data - Needs Attention Athletes
const needsAttentionAthletes = [
  { 
    id: 1,
    name: "Giulia Verdi", 
    avatar: "GV",
    issue: "Infortunio",
    issueType: "critical",
    details: "Dolore spalla destra - segnalato ieri",
    lastActivity: "2 ore fa"
  },
  { 
    id: 2,
    name: "Marco Rossi", 
    avatar: "MR",
    issue: "Check-in Mancato",
    issueType: "critical",
    details: "Nessun check-in da 4 giorni",
    lastActivity: "4 giorni fa"
  },
  { 
    id: 3,
    name: "Elena Bianchi", 
    avatar: "EB",
    issue: "Readiness Critica",
    issueType: "critical",
    details: "Score readiness 2/10 - stress elevato",
    lastActivity: "5 ore fa"
  },
  { 
    id: 4,
    name: "Luca Ferrari", 
    avatar: "LF",
    issue: "Stallo Peso",
    issueType: "warning",
    details: "Peso invariato da 3 settimane",
    lastActivity: "1 giorno fa"
  },
  { 
    id: 5,
    name: "Sara Conti", 
    avatar: "SC",
    issue: "Volume in calo",
    issueType: "warning",
    details: "-25% volume settimana vs programma",
    lastActivity: "6 ore fa"
  },
];

// Mock Data - Business Health Stats
const businessStats = [
  { 
    label: "Clienti Attivi", 
    value: "24", 
    change: "+2 questo mese",
    trend: "up",
    icon: Users 
  },
  { 
    label: "Compliance Media", 
    value: "87%", 
    change: "+5% vs mese scorso",
    trend: "up",
    icon: TrendingUp 
  },
  { 
    label: "Check-in vs Attesi", 
    value: "18/24", 
    change: "75% risposta",
    trend: "neutral",
    icon: ClipboardCheck 
  },
];

// Mock Data - Activity Feed
const activityFeed = [
  { 
    id: 1,
    type: "workout",
    athlete: "Sofia Neri",
    action: "ha completato",
    target: "Upper Body A",
    time: "5 min fa",
    icon: Dumbbell
  },
  { 
    id: 2,
    type: "photo",
    athlete: "Marco Bianchi",
    action: "ha caricato",
    target: "foto progresso",
    time: "23 min fa",
    icon: Camera
  },
  { 
    id: 3,
    type: "message",
    athlete: "Giulia Verdi",
    action: "ti ha scritto",
    target: "nuovo messaggio",
    time: "45 min fa",
    icon: MessageSquare
  },
  { 
    id: 4,
    type: "checkin",
    athlete: "Andrea Russo",
    action: "ha inviato",
    target: "check-in settimanale",
    time: "1 ora fa",
    icon: ClipboardCheck
  },
  { 
    id: 5,
    type: "weight",
    athlete: "Laura Gallo",
    action: "ha registrato",
    target: "peso: 62.3 kg",
    time: "2 ore fa",
    icon: Scale
  },
  { 
    id: 6,
    type: "workout",
    athlete: "Paolo Marino",
    action: "ha iniziato",
    target: "Lower Body B",
    time: "2 ore fa",
    icon: Dumbbell
  },
  { 
    id: 7,
    type: "readiness",
    athlete: "Chiara Costa",
    action: "readiness score",
    target: "8/10",
    time: "3 ore fa",
    icon: HeartPulse
  },
  { 
    id: 8,
    type: "workout",
    athlete: "Davide Greco",
    action: "ha completato",
    target: "Cardio HIIT",
    time: "4 ore fa",
    icon: Dumbbell
  },
];

const getIssueIcon = (issue: string) => {
  switch (issue) {
    case "Infortunio":
      return Ban;
    case "Check-in Mancato":
      return Clock;
    case "Readiness Critica":
      return HeartPulse;
    case "Stallo Peso":
      return Scale;
    case "Volume in calo":
      return Activity;
    default:
      return AlertTriangle;
  }
};

export default function CoachDashboard() {
  return (
    <CoachLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Benvenuto, Marco. Ecco la panoramica di oggi.</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Business Health Stats - Top Row */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-3 gap-4">
              {businessStats.map((stat) => (
                <Card key={stat.label} className="hover-lift">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                        <p className={`text-xs font-medium ${
                          stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'
                        }`}>
                          {stat.change}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity Feed Header - Right Column */}
          <div className="col-span-12 lg:col-span-4 lg:row-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Activity Feed
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-7">
                    Vedi tutto
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="px-4 pb-4 space-y-1">
                    {activityFeed.map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <activity.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.athlete}</span>
                            {" "}
                            <span className="text-muted-foreground">{activity.action}</span>
                            {" "}
                            <span className="font-medium">{activity.target}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Needs Attention Module - Priority Section */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Triage / Needs Attention</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {needsAttentionAthletes.length} atleti richiedono la tua attenzione
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary">
                    Gestisci tutti <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {needsAttentionAthletes.map((athlete) => {
                    const IssueIcon = getIssueIcon(athlete.issue);
                    return (
                      <div 
                        key={athlete.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-background">
                              <span className="text-sm font-semibold text-primary">
                                {athlete.avatar}
                              </span>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center ${
                              athlete.issueType === 'critical' ? 'bg-destructive' : 'bg-warning'
                            }`}>
                              <IssueIcon className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{athlete.name}</span>
                              <Badge 
                                variant="secondary"
                                className={`text-[10px] font-semibold px-2 py-0 h-5 ${
                                  athlete.issueType === 'critical' 
                                    ? 'bg-destructive/10 text-destructive border-0' 
                                    : 'bg-warning/10 text-warning border-0'
                                }`}
                              >
                                {athlete.issue}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{athlete.details}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {athlete.lastActivity}
                          </span>
                          <Button 
                            size="sm" 
                            className={`h-8 text-xs font-medium ${
                              athlete.issueType === 'critical'
                                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                                : 'bg-warning hover:bg-warning/90 text-warning-foreground'
                            }`}
                          >
                            Quick Action
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </CoachLayout>
  );
}
