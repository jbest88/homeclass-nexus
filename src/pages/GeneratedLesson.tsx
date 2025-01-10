import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonContent } from "@/components/lesson/LessonContent";
import { QuestionComponent } from "@/components/lesson/QuestionComponent";
import { Database } from "@/integrations/supabase/types";
import { useUser } from "@supabase/auth-helpers-react";

type BaseQuestion = {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'multiple-answer';
};

type TextQuestion = BaseQuestion & {
  type: 'text';
};

type MultipleChoiceQuestion = BaseQuestion & {
  type: 'multiple-choice';
  options: string[];
};

type MultipleAnswerQuestion = BaseQuestion & {
  type: 'multiple-answer';
  options: string[];
  correctAnswers: string[];
};

type Question = TextQuestion | MultipleChoiceQuestion | MultipleAnswerQuestion;

type Lesson = Database['public']['Tables']['generated_lessons']['Row'];

type AnswerState = {
  value: string | string[];
  isCorrect?: boolean;
  explanation?: string;
  startTime?: number;
};

const GeneratedLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const updateProficiencyMutation = useMutation({
    mutationFn: async ({ subject, isCorrect }: { subject: string; isCorrect: boolean }) => {
      const { data: existing } = await supabase
        .from("subject_proficiency")
        .select("*")
        .eq("user_id", user?.id)
        .eq("subject", subject)
        .single();

      if (existing) {
        const newProficiency = isCorrect 
          ? Math.min(existing.proficiency_level + 1, 10)
          : Math.max(existing.proficiency_level - 1, 1);

        return supabase
          .from("subject_proficiency")
          .update({
            proficiency_level: newProficiency,
            total_questions_attempted: existing.total_questions_attempted + 1,
            correct_answers: existing.correct_answers + (isCorrect ? 1 : 0),
          })
          .eq("id", existing.id);
      } else {
        return supabase
          .from("subject_proficiency")
          .insert({
            user_id: user?.id,
            subject,
            proficiency_level: isCorrect ? 2 : 1,
            total_questions_attempted: 1,
            correct_answers: isCorrect ? 1 : 0,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-proficiency"] });
    },
  });

  const handleDelete = async () => {
    if (!lessonId || isDeleting) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("generated_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast.success("Lesson deleted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnswerChange = (index: number, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { 
        value,
        startTime: prev[index]?.startTime || Date.now()
      }
    }));
  };

  const handleSubmit = async () => {
    if (!lesson?.questions || !user?.id) return;
    
    setIsSubmitting(true);
    const questions = lesson.questions as Question[];
    
    try {
      const results = await Promise.all(
        questions.map(async (question, index) => {
          const userAnswer = answers[index]?.value || "";
          const startTime = answers[index]?.startTime || Date.now();
          const responseTime = Math.round((Date.now() - startTime) / 1000); // Convert to seconds

          const response = await supabase.functions.invoke("validateAnswers", {
            body: {
              question: question.question,
              userAnswer,
              correctAnswer: question.answer,
              type: question.type,
              lessonContent: lesson.content,
              ...(question.type === 'multiple-answer' && { correctAnswers: question.correctAnswers }),
            },
          });

          if (response.error) throw response.error;

          // Store question response
          await supabase.from("question_responses").insert({
            user_id: user.id,
            lesson_id: lessonId,
            question_index: index,
            is_correct: response.data.isCorrect,
            response_time: responseTime,
          });

          // Update subject proficiency
          await updateProficiencyMutation.mutateAsync({
            subject: lesson.subject,
            isCorrect: response.data.isCorrect,
          });

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

      // Invalidate queries to refresh stats
      queryClient.invalidateQueries({ queryKey: ["question-responses"] });
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
      <LessonHeader onDelete={handleDelete} isDeleting={isDeleting} />
      <LessonContent 
        title={lesson.title}
        subject={lesson.subject}
        content={lesson.content}
      />

      {hasQuestions && questions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Practice Questions</h3>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <QuestionComponent
                key={index}
                question={question}
                index={index}
                answer={answers[index]}
                onAnswerChange={handleAnswerChange}
              />
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
    </div>
  );
};

export default GeneratedLesson;