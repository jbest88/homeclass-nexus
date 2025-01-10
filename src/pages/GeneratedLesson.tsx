import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Question = {
  question: string;
  answer: string;
};

type Lesson = Database['public']['Tables']['generated_lessons']['Row'];

type AnswerState = {
  value: string;
  isCorrect?: boolean;
  explanation?: string;
};

const GeneratedLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { value }
    }));
  };

  const handleSubmit = async () => {
    if (!lesson?.questions) return;
    
    setIsSubmitting(true);
    const questions = lesson.questions as Question[];
    
    try {
      const results = await Promise.all(
        questions.map(async (question, index) => {
          const userAnswer = answers[index]?.value || "";
          const response = await supabase.functions.invoke("validateAnswers", {
            body: {
              question: question.question,
              userAnswer,
              correctAnswer: question.answer,
            },
          });

          if (response.error) throw response.error;
          return { index, ...response.data };
        })
      );

      const newAnswers = { ...answers };
      results.forEach(({ index, isCorrect, explanation }) => {
        newAnswers[index] = {
          ...newAnswers[index],
          isCorrect,
          explanation,
        };
      });

      setAnswers(newAnswers);
      
      const allCorrect = results.every(r => r.isCorrect);
      if (allCorrect) {
        toast.success("Congratulations! All answers are correct!");
      } else {
        toast.info("Some answers need review. Check the feedback below.");
      }
    } catch (error) {
      console.error("Error validating answers:", error);
      toast.error("Failed to validate answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!lesson) {
    return <div>Lesson not found</div>;
  }

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
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-4">Q: {question.question}</p>
                      <Input
                        placeholder="Type your answer here..."
                        value={answers[index]?.value || ""}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="mb-2"
                      />
                      {answers[index]?.isCorrect !== undefined && (
                        <div className={`mt-2 p-2 rounded ${
                          answers[index].isCorrect 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          <p className="font-medium">
                            {answers[index].isCorrect ? "Correct!" : "Incorrect"}
                          </p>
                          {answers[index].explanation && (
                            <p className="text-sm mt-1">{answers[index].explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="mt-4"
                >
                  {isSubmitting ? "Checking answers..." : "Submit Answers"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratedLesson;