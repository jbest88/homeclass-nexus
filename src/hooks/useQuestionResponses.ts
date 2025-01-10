import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { useProficiency } from "./useProficiency";
import { useQueryClient } from "@tanstack/react-query";

type AnswerState = {
  value: string | string[];
  isCorrect?: boolean;
  explanation?: string;
  startTime?: number;
};

export const useQuestionResponses = (lessonId: string, subject: string) => {
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useUser();
  const { updateProficiencyMutation } = useProficiency();
  const queryClient = useQueryClient();

  const handleAnswerChange = (index: number, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [index]: { 
        value,
        startTime: prev[index]?.startTime || Date.now()
      }
    }));
  };

  const handleSubmit = async (questions: any[]) => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const results = await Promise.all(
        questions.map(async (question, index) => {
          const userAnswer = answers[index]?.value || "";
          const startTime = answers[index]?.startTime || Date.now();
          const responseTime = Math.round((Date.now() - startTime) / 1000);

          const response = await supabase.functions.invoke("validateAnswers", {
            body: {
              question: question.question,
              userAnswer,
              correctAnswer: question.answer,
              type: question.type,
              ...(question.type === 'multiple-answer' && { correctAnswers: question.correctAnswers }),
            },
          });

          if (response.error) throw response.error;

          await supabase.from("question_responses").insert({
            user_id: user.id,
            lesson_id: lessonId,
            question_index: index,
            is_correct: response.data.isCorrect,
            response_time: responseTime,
          });

          await updateProficiencyMutation.mutateAsync({
            subject,
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

      queryClient.invalidateQueries({ queryKey: ["question-responses"] });
    } catch (error) {
      console.error("Error validating answers:", error);
      toast.error("Failed to validate answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    answers,
    isSubmitting,
    handleAnswerChange,
    handleSubmit,
  };
};