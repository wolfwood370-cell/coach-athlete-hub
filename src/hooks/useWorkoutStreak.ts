import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, isYesterday, isToday, parseISO } from 'date-fns';

interface StreakData {
  currentStreak: number;
  isStreakDay: boolean;
  loading: boolean;
}

export function useWorkoutStreak(athleteId?: string): StreakData {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isStreakDay, setIsStreakDay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!athleteId) {
      setLoading(false);
      return;
    }

    const fetchStreak = async () => {
      try {
        // Fetch last 30 days of workout logs
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('workout_logs')
          .select('completed_at')
          .eq('athlete_id', athleteId)
          .gte('completed_at', thirtyDaysAgo)
          .order('completed_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          setCurrentStreak(1); // This is their first workout
          setIsStreakDay(true);
          setLoading(false);
          return;
        }

        // Get unique workout days
        const workoutDays = new Set(
          data.map(log => format(parseISO(log.completed_at!), 'yyyy-MM-dd'))
        );

        // Calculate streak
        let streak = 1; // Today counts
        let checkDate = subDays(new Date(), 1); // Start from yesterday

        while (true) {
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          if (workoutDays.has(dateStr)) {
            streak++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }

        setCurrentStreak(streak);
        setIsStreakDay(streak > 1);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching workout streak:', error);
        setCurrentStreak(1);
        setLoading(false);
      }
    };

    fetchStreak();
  }, [athleteId]);

  return { currentStreak, isStreakDay, loading };
}
