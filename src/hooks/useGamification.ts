import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

interface GamificationData {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  isStreakDay: boolean;
  loading: boolean;
}

/**
 * Hook for gamification data including workout/metrics streaks
 * Counts consecutive days with activity in workout_logs OR daily_readiness
 */
export function useGamification(athleteId?: string): GamificationData {
  const [data, setData] = useState<GamificationData>({
    currentStreak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
    isStreakDay: false,
    loading: true,
  });

  useEffect(() => {
    if (!athleteId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchGamificationData = async () => {
      try {
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const today = format(new Date(), 'yyyy-MM-dd');

        // Fetch workout logs
        const { data: workoutLogs, error: workoutError } = await supabase
          .from('workout_logs')
          .select('completed_at')
          .eq('athlete_id', athleteId)
          .gte('completed_at', thirtyDaysAgo)
          .not('completed_at', 'is', null);

        if (workoutError) throw workoutError;

        // Fetch daily readiness entries
        const { data: readinessLogs, error: readinessError } = await supabase
          .from('daily_readiness')
          .select('date')
          .eq('athlete_id', athleteId)
          .gte('date', thirtyDaysAgo);

        if (readinessError) throw readinessError;

        // Combine all activity days into a Set
        const activityDays = new Set<string>();

        // Add workout days
        workoutLogs?.forEach(log => {
          if (log.completed_at) {
            const dayStr = format(parseISO(log.completed_at), 'yyyy-MM-dd');
            activityDays.add(dayStr);
          }
        });

        // Add readiness days
        readinessLogs?.forEach(log => {
          if (log.date) {
            activityDays.add(log.date);
          }
        });

        // Check if today has activity
        const hasTodayActivity = activityDays.has(today);

        // Calculate current streak (consecutive days ending today or yesterday)
        let currentStreak = 0;
        let checkDate = hasTodayActivity ? new Date() : subDays(new Date(), 1);
        
        // If no activity today and no activity yesterday, streak is 0
        if (!hasTodayActivity && !activityDays.has(format(subDays(new Date(), 1), 'yyyy-MM-dd'))) {
          currentStreak = 0;
        } else {
          // Count consecutive days
          while (true) {
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            if (activityDays.has(dateStr)) {
              currentStreak++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
            // Safety limit
            if (currentStreak > 365) break;
          }
        }

        // Calculate longest streak from the data we have
        let longestStreak = currentStreak;
        const sortedDays = Array.from(activityDays).sort();
        let tempStreak = 1;
        
        for (let i = 1; i < sortedDays.length; i++) {
          const prevDate = parseISO(sortedDays[i - 1]);
          const currDate = parseISO(sortedDays[i]);
          const diff = differenceInDays(currDate, prevDate);
          
          if (diff === 1) {
            tempStreak++;
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
          } else {
            tempStreak = 1;
          }
        }

        // Total workouts
        const totalWorkouts = workoutLogs?.length || 0;

        setData({
          currentStreak,
          longestStreak,
          totalWorkouts,
          isStreakDay: hasTodayActivity,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching gamification data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchGamificationData();
  }, [athleteId]);

  return data;
}
