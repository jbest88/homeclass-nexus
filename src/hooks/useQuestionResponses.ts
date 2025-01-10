import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { useProficiency } from "./useProficiency";
import { useQueryClient } from "@tanstack/react-query";
import { useAnswerValidation } from "./useAnswerValidation";
import { AnswerState, Question } from "@/types/questions";

export const useQuestionResponses = (lessonId: string, subject: string) => {
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const user = useUser();
  const { updateProficiencyMutation } = useProficiency();
  const queryClient = useQueryClient();
  const { validateAnswer } = useAnswerValidation();

  const handleAnswerChange = (index: number, value: string | string[]) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [index]: {
        answer: value,
        startTime: prev[index]?.startTime || Date.now(),
        isSubmitted: false,
      }
    }));
  };

  const handleSubmit = async (questions: Question[]) => {
    if (!user?.id || isSubmitted) return;
    setIsSubmitting(true);
    
    try {
      const results = await Promise.all(
        questions.map(async (question, index) => {
          const userAnswer = answers[index]?.answer || "";
          const startTime = answers[index]?.startTime || Date.now();

          const result = await validateAnswer(question, userAnswer, startTime);

          await supabase.from("question_responses").insert({
            user_id: user.id,
            lesson_id: lessonId,
            question_index: index,
            is_correct: result.isCorrect,
            response_time: result.responseTime,
          });

          await updateProficiencyMutation.mutateAsync({
            subject,
            isCorrect: result.isCorrect,
          });

          return { index, ...result };
        })
      );

      const newAnswers = { ...answers };
      results.forEach(({ index, isCorrect, explanation }) => {
        newAnswers[index] = {
          ...newAnswers[index],
          isCorrect,
          explanation,
          isSubmitted: true,
        };
      });

      setAnswers(newAnswers);
      setIsSubmitted(true);
      
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
    isSubmitted,
    handleAnswerChange,
    handleSubmit,
  };
};