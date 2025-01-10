import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";

const StudyStats = () => {
  const user = useUser();

  const { data: proficiencyData } = useQuery({
    queryKey: ["subject-proficiency"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subject_proficiency")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: questionResponses } = useQuery({
    queryKey: ["question-responses"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("question_responses")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalQuestions = questionResponses?.length || 0;
  const correctAnswers = questionResponses?.filter(r => r.is_correct)?.length || 0;
  const averageProficiency = proficiencyData?.reduce((acc, curr) => acc + curr.proficiency_level, 0) / (proficiencyData?.length || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Study Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Questions Attempted</span>
            <span className="text-2xl font-bold">{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Correct Answers</span>
            <span className="text-2xl font-bold">{correctAnswers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-2xl font-bold">
              {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average Proficiency</span>
            <span className="text-2xl font-bold">{Math.round(averageProficiency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyStats;