import { Card } from 'react-bootstrap';
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
      <Card.Header>
        <div className="d-flex align-items-center gap-2">
          <BookOpen size={20} />
          <Card.Title className="mb-0">Study Stats</Card.Title>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="d-flex flex-column gap-4">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Questions Attempted</span>
            <span className="h3 mb-0">{totalQuestions}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Correct Answers</span>
            <span className="h3 mb-0">{correctAnswers}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Success Rate</span>
            <span className="h3 mb-0">
              {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
            </span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Average Proficiency</span>
            <span className="h3 mb-0">{Math.round(averageProficiency)}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StudyStats;