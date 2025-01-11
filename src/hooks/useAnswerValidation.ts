import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/questions";

export const useAnswerValidation = () => {
  const validateAnswer = async (
    question: Question,
    userAnswer: string | string[],
    startTime: number
  ) => {
    const responseTime = Math.round((Date.now() - startTime) / 1000);

    const response = await supabase.functions.invoke("validateAnswers", {
      body: {
        question: question.question,
        userAnswer,
        correctAnswer: question.answer,
        type: question.type,
        ...(question.type === 'multiple-answer' && { 
          correctAnswers: (question as any).correctAnswers 
        }),
      },
    });

    if (response.error) throw response.error;

    return {
      isCorrect: response.data.isCorrect,
      explanation: response.data.explanation,
      responseTime,
    };
  };

  return { validateAnswer };
};