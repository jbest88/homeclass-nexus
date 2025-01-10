import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Question = {
  question: string;
  answer: string;
};

type Lesson = Database['public']['Tables']['generated_lessons']['Row'];

const GeneratedLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["generated-lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!lesson) {
    return <div>Lesson not found</div>;
  }

  // Type guard to check if questions is an array
  const hasQuestions = Array.isArray(lesson.questions);
  const questions = hasQuestions ? lesson.questions as Question[] : [];

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Subject: {lesson.subject}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">{lesson.content}</div>
          </div>

          {hasQuestions && questions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Practice Questions</h3>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Q: {question.question}</p>
                    <p className="text-muted-foreground">A: {question.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratedLesson;