import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonContent } from "@/components/lesson/LessonContent";
import { QuestionComponent } from "@/components/lesson/QuestionComponent";
import { Database } from "@/integrations/supabase/types";

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
};

const GeneratedLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
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
              type: question.type,
              lessonContent: lesson.content,
              ...(question.type === 'multiple-answer' && { correctAnswers: question.correctAnswers }),
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