import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AthleteCard } from "@/components/coach/AthleteCard";
import { InviteAthleteDialog } from "@/components/coach/InviteAthleteDialog";
import { useAthleteRiskAnalysis } from "@/hooks/useAthleteRiskAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Users, UserPlus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CoachAthletes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { allAthletes, isLoading } = useAthleteRiskAnalysis();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <CoachLayout title="Athletes" subtitle="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title="Athletes" subtitle="Manage your athlete roster">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search athletes..." 
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <InviteAthleteDialog 
              trigger={
                <Button size="sm" className="gradient-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Athlete
                </Button>
              }
            />
          </div>
        </div>

        {/* Athletes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-1.5" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
        ) : allAthletes.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border bg-muted/10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No athletes yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Invite your athletes to start tracking their progress.
            </p>
            <InviteAthleteDialog 
              trigger={
                <Button className="gradient-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite your first athlete
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAthletes.map((athlete) => {
              const lastActivityDate = athlete.readinessDate;
              const isActive = lastActivityDate
                ? (Date.now() - new Date(lastActivityDate).getTime()) < 3 * 24 * 60 * 60 * 1000
                : false;

              const programName = athlete.riskLevel === "high" 
                ? "Recovery Protocol" 
                : athlete.riskLevel === "moderate"
                  ? "Deload Week"
                  : athlete.acwr !== null
                    ? "Hypertrophy Block"
                    : null;

              return (
                <AthleteCard
                  key={athlete.athleteId}
                  athleteId={athlete.athleteId}
                  athleteName={athlete.athleteName}
                  avatarUrl={athlete.avatarUrl}
                  avatarInitials={athlete.avatarInitials}
                  lastActivityDate={lastActivityDate}
                  programName={programName}
                  isActive={isActive}
                />
              );
            })}
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
