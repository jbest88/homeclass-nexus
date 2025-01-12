import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { useProficiency } from "./useProficiency";
import { useQueryClient } from "@tanstack/react-query";
import { useAnswerValidation } from "./useAnswerValidation";
import { AnswerState, Question } from "@/types/questions";

interface Performance {
  correctPercentage: number;
  totalQuestions: number;
  correctAnswers: number;
}

export const useQuestionResponses = (lessonId: string, subject: string, isPreAnswered: boolean = false) => {
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isPreAnswered);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const user = useUser();
  const { updateProficiencyMutation } = useProficiency();
  const queryClient = useQueryClient();
  const { validateAnswer } = useAnswerValidation();

  const initializeAnswers = (initialAnswers: AnswerState[]) => {
    const answersRecord: Record<number, AnswerState> = {};
    initialAnswers.forEach((answer, index) => {
      answersRecord[index] = answer;
    });
    setAnswers(answersRecord);
    setIsSubmitted(true);
  };

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

  const updateDailyStats = async (correctCount: number, totalCount: number) => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // First, get current daily stats
    const { data: existingStats, error: fetchError } = await supabase
      .from("daily_study_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching daily stats:", fetchError);
      return;
    }

    if (existingStats) {
      // Update existing stats
      const { error: updateError } = await supabase
        .from("daily_study_stats")
        .update({
          total_questions: existingStats.total_questions + totalCount,
          correct_answers: existingStats.correct_answers + correctCount,
        })
        .eq("id", existingStats.id);

      if (updateError) {
        console.error("Error updating daily stats:", updateError);
      }
    } else {
      // Create new daily stats
      const { error: insertError } = await supabase
        .from("daily_study_stats")
        .insert([
          {
            user_id: user.id,
            date: today,
            total_questions: totalCount,
            correct_answers: correctCount,
          }
        ]);

      if (insertError) {
        console.error("Error inserting daily stats:", insertError);
      }
    }

    // Invalidate the daily stats query to trigger a refresh
    queryClient.invalidateQueries({ queryKey: ["daily-stats"] });
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
          
          // Ensure we have a valid boolean value for is_correct
          const isCorrect = result.isCorrect === true;
          
          // Insert response with validated boolean
          const { error: responseError } = await supabase
            .from("question_responses")
            .insert({
              user_id: user.id,
              lesson_id: lessonId,
              question_index: index,
              is_correct: isCorrect,
              response_time: result.responseTime,
            });

          if (responseError) {
            console.error("Error inserting question response:", responseError);
            throw responseError;
          }

          await updateProficiencyMutation.mutateAsync({
            subject,
            isCorrect,
          });

          return { index, ...result };
        })
      );

      const newAnswers = { ...answers };
      const correctAnswers = results.filter(r => r.isCorrect).length;
      const correctPercentage = (correctAnswers / questions.length) * 100;

      // Update daily stats
      await updateDailyStats(correctAnswers, questions.length);

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
      setPerformance({
        correctPercentage,
        totalQuestions: questions.length,
        correctAnswers,
      });
      
      if (correctPercentage >= 70) {
        toast.success("Great job! You're ready to move forward!");
      } else {
        toast.info("Let's try a different approach to help you understand better.");
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
    performance,
    handleAnswerChange,
    handleSubmit,
    initializeAnswers,
  };
};