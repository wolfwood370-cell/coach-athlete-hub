import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

export default function CoachCalendar() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  return (
    <CoachLayout title="Calendar" subtitle="Scheduled workouts and events">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Widget */}
          <Card className="lg:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          {/* Scheduled Events */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Scheduled for {date?.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CalendarDays className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Workout schedules assigned to athletes will appear here. Start by creating a program and assigning it to an athlete.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
}
