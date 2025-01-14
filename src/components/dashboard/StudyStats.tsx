import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { useDailyStats } from "@/hooks/useDailyStats";

const StudyStats = () => {
  const user = useUser();
  const { data: dailyStats, isLoading: isDailyStatsLoading } = useDailyStats();

  const { data: lessonsCreatedToday } = useQuery({
    queryKey: ["lessons-created-today"],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("generated_lessons")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  if (isDailyStatsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Loading Stats...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Today's Study Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Questions Attempted</span>
            <span className="text-2xl font-bold">{dailyStats?.total_questions || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Correct Answers</span>
            <span className="text-2xl font-bold">{dailyStats?.correct_answers || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-2xl font-bold">
              {dailyStats?.total_questions > 0
                ? Math.round((dailyStats.correct_answers / dailyStats.total_questions) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Lessons Created Today</span>
            <span className="text-2xl font-bold">{lessonsCreatedToday || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyStats;