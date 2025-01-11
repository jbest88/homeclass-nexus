import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";

export const useDailyStats = () => {
  const user = useUser();
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  return useQuery({
    queryKey: ["daily-stats", today],
    queryFn: async () => {
      if (!user) return null;

      // First, try to get today's stats
      const { data: existingStats, error: fetchError } = await supabase
        .from("daily_study_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }

      // If we already have stats for today, return them
      if (existingStats) {
        return existingStats;
      }

      // If no stats exist for today, create a new entry
      const { data: newStats, error: insertError } = await supabase
        .from("daily_study_stats")
        .insert([
          {
            user_id: user.id,
            date: today,
            total_questions: 0,
            correct_answers: 0,
            average_proficiency: 0
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      return newStats;
    },
    enabled: !!user,
  });
};